import base64
from core.setup_gmail import get_gmail_service
from core.classifier import classify_email
from core.database import SessionLocal, Email, init_db
from sqlalchemy.orm import Session
import os

def get_message_body(payload):
    """Recursively extract text body from Gmail payload."""
    body = ""
    if 'parts' in payload:
        for part in payload['parts']:
            body += get_message_body(part)
    elif payload['mimeType'] == 'text/plain':
        data = payload['body'].get('data')
        if data:
            body += base64.urlsafe_b64decode(data).decode('utf-8')
    return body

def fetch_and_process_emails(max_results=10):
    service = get_gmail_service()
    if not service:
        return

    # Initialize DB if not exists
    init_db()
    db: Session = SessionLocal()

    print(f"Searching: Fetching last {max_results} emails (including SPAM)...")
    
    # Search in both INBOX and SPAM
    results = service.users().messages().list(
        userId='me', 
        q="label:INBOX OR label:SPAM", 
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])

    if not messages:
        print("No new messages found.")
        return

    for msg in messages:
        # Check if already in DB
        existing = db.query(Email).filter(Email.id == msg['id']).first()
        if existing:
            continue

        # Fetch full message details
        msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
        
        headers = msg_data['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
        sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown")
        snippet = msg_data.get('snippet', "")
        
        # Extract body
        body = get_message_body(msg_data['payload'])
        
        # Classify
        category, importance, summary = classify_email(subject, snippet)

        # Save to DB
        new_email = Email(
            id=msg['id'],
            thread_id=msg['threadId'],
            sender=sender,
            subject=subject,
            snippet=snippet,
            body=body,
            category=category,
            importance=importance,
            summary=summary
        )
        
        db.add(new_email)
        clean_subject = subject.encode('ascii', 'ignore').decode('ascii')
        print(f"Email Processed: {clean_subject[:40]}... | Priority: {importance}")

    db.commit()
    db.close()
    print("Sync Complete.")

if __name__ == "__main__":
    fetch_and_process_emails()
