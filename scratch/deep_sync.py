import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from core.fetcher import fetch_and_process_emails
from core.database import SessionLocal, Email

def deep_sync(count=50):
    print(f"🚀 Starting Deep Sync: Fetching last {count} emails (ignoring 1-day limit)...")
    
    # We'll temporarily modify the behavior or just call it with a custom query if we could
    # But since fetch_and_process_emails has the query hardcoded, let's just make a local version here
    from core.setup_gmail import get_gmail_service
    from core.classifier import classify_email
    from core.database import SessionLocal, Email, init_db
    from sqlalchemy.orm import Session
    import base64

    def get_body(payload):
        body = ""
        if 'parts' in payload:
            for part in payload['parts']: body += get_body(part)
        elif payload['mimeType'] == 'text/plain':
            data = payload['body'].get('data')
            if data: body += base64.urlsafe_b64decode(data).decode('utf-8')
        return body

    service = get_gmail_service()
    init_db()
    db: Session = SessionLocal()

    # BROAD SEARCH: No date limit, just getting the last N messages
    results = service.users().messages().list(
        userId='me', 
        q="label:INBOX OR label:SPAM", 
        maxResults=count
    ).execute()
    
    messages = results.get('messages', [])
    print(f"Found {len(messages)} messages to process.")

    for msg in messages:
        existing = db.query(Email).filter(Email.id == msg['id']).first()
        if existing: continue

        msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
        headers = msg_data['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
        sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown")
        snippet = msg_data.get('snippet', "")
        
        category, importance, summary = classify_email(subject, snippet)

        new_email = Email(
            id=msg['id'],
            thread_id=msg['threadId'],
            sender=sender,
            subject=subject,
            snippet=snippet,
            body=get_body(msg_data['payload']),
            category=category,
            importance=importance,
            summary=summary
        )
        db.add(new_email)
        print(f"✅ Synced: {subject[:40]}... -> {category}")

    db.commit()
    db.close()
    print("✨ Deep Sync Complete.")

if __name__ == "__main__":
    deep_sync(50) # Fetching last 50 emails
