import time
from core.fetcher import fetch_and_process_emails
from core.database import SessionLocal, Email
from plyer import notification
import schedule

def notify_user(email_subject, sender):
    """Send a desktop notification for urgent emails."""
    notification.notify(
        title="URGENT EMAIL DETECTED!",
        message=f"From: {sender}\nSubject: {email_subject}",
        app_name="AI Email Assistant",
        timeout=10
    )

def run_sync():
    print(f"\n--- Sync Started at {time.strftime('%H:%M:%S')} ---")
    fetch_and_process_emails(max_results=20)
    
    # Check for new high-priority emails to notify
    db = SessionLocal()
    urgent_emails = db.query(Email).filter(Email.importance >= 8, Email.is_read == 0).all()
    
    for email in urgent_emails:
        print(f"Found urgent email: {email.subject}")
        notify_user(email.subject, email.sender)
        # Mark as 'notified' by setting is_read to 1 for now, or use a separate flag
        email.is_read = 1 
    
    db.commit()
    db.close()
    print("--- Sync Finished ---")

if __name__ == "__main__":
    # Run once immediately
    run_sync()
    
    # Schedule to run every 15 minutes
    schedule.every(15).minutes.do(run_sync)
    
    print("\nSystem is running. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(1)
