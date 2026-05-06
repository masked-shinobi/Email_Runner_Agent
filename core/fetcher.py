import os.path
import base64
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from core.database import SessionLocal, Email, init_db
from core.classifier import classify_email, rule_based_classify
from sqlalchemy.orm import Session
import datetime

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
TOKEN_DIR = "tokens"

if not os.path.exists(TOKEN_DIR):
    os.makedirs(TOKEN_DIR)

def get_message_body(payload):
    """Recursively find the body of the message. Prefer text/plain, fallback to text/html."""
    from bs4 import BeautifulSoup
    
    parts = payload.get('parts', [])
    body = ""
    html_body = ""

    if not parts:
        data = payload.get('body', {}).get('data')
        if data:
            decoded = base64.urlsafe_b64decode(data).decode(errors='ignore')
            if payload.get('mimeType') == 'text/html':
                return BeautifulSoup(decoded, 'html.parser').get_text(separator='\n', strip=True)
            return decoded
        return ""

    for part in parts:
        mimeType = part.get('mimeType')
        data = part.get('body', {}).get('data')
        
        if mimeType == 'text/plain' and data:
            return base64.urlsafe_b64decode(data).decode(errors='ignore')
        elif mimeType == 'text/html' and data:
            html_body = base64.urlsafe_b64decode(data).decode(errors='ignore')
        elif 'parts' in part:
            res = get_message_body(part)
            if res: return res

    if html_body:
        return BeautifulSoup(html_body, 'html.parser').get_text(separator='\n', strip=True)
    
    return ""

def sync_google_account(token_path):
    creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    service = build('gmail', 'v1', credentials=creds)
    
    # Get user email for tagging
    profile = service.users().getProfile(userId='me').execute()
    user_email = profile.get('emailAddress')
    print(f"Starting Google Sync for {user_email}...")

    init_db()
    db: Session = SessionLocal()

    # Revert to 2 days as requested
    results = service.users().messages().list(userId='me', q='newer_than:2d', maxResults=30).execute()
    messages = results.get('messages', [])
    # (Debug print removed)

    # (Cleanup logic moved to fetch_all_google_accounts to prevent DB locking)

    for msg in messages:
        msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
        headers = msg_data['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
        sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown")
        snippet = msg_data.get('snippet', "")
        body = get_message_body(msg_data['payload'])
        
        existing = db.query(Email).filter(Email.id == msg['id']).first()
        if existing: continue

        # QUICK CLASSIFICATION (Rules Only - Instant)
        category, importance = rule_based_classify(subject, snippet)
        if not category:
            category, importance = "General", 5
            summary = "AI analysis pending..."
            ai_processed = 0
        else:
            summary = "Categorized by Rules."
            ai_processed = 1 # Rules are enough, skip AI if rules hit

        # Extract actual email timestamp from headers to match Gmail UI
        import dateutil.parser
        from datetime import timezone
        date_header = next((h['value'] for h in headers if h['name'] == 'Date'), None)
        email_ts = None
        if date_header:
            try:
                email_ts = dateutil.parser.parse(date_header)
                if email_ts.tzinfo is None:
                    email_ts = email_ts.replace(tzinfo=timezone.utc)
                else:
                    email_ts = email_ts.astimezone(timezone.utc)
            except:
                pass
        
        if not email_ts:
            internal_date_ms = int(msg_data.get('internalDate', 0))
            email_ts = datetime.fromtimestamp(internal_date_ms / 1000, tz=timezone.utc)

        new_email = Email(
            id=msg['id'],
            thread_id=msg['threadId'],
            sender=sender,
            subject=subject,
            snippet=snippet,
            body=body,
            category=category,
            importance=importance,
            summary=summary,
            source_email=user_email,
            timestamp=email_ts,
            ai_processed=ai_processed
        )
        db.add(new_email)
        # Safe print for Windows consoles
        safe_subject = subject.encode('ascii', 'ignore').decode('ascii')

    db.commit()
    db.close()

def fetch_all_google_accounts():
    from core.setup_gmail import list_google_accounts, TOKEN_DIR
    accounts = list_google_accounts()
    
    if not accounts:
        print("No Google accounts connected.")
        return

    # RUN CLEANUP ONCE BEFORE STARTING ALL GOOGLE SYNCS
    from core.database import SessionLocal, Email
    from datetime import datetime, timedelta
    db = SessionLocal()
    cutoff = datetime.utcnow() - timedelta(days=2)
    deleted = db.query(Email).filter(Email.timestamp < cutoff, Email.is_pinned == 0).delete()
    if deleted: 
        print(f"  [CLEANUP] Removed {deleted} old emails before sync.")
        db.commit()
    db.close()

    for email in accounts:
        try:
            token_path = os.path.join(TOKEN_DIR, f"{email}.json")
            if os.path.exists(token_path):
                sync_google_account(token_path)
            elif email == 'token': # Handle legacy naming if any
                sync_google_account('token.json')
        except Exception as e:
            print(f"Error syncing Google account {email}: {e}")

if __name__ == "__main__":
    fetch_all_google_accounts()
