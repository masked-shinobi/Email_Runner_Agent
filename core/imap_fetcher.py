import imaplib
import email
from email.header import decode_header
import datetime
import os
from core.database import SessionLocal, Email, Config, Account, init_db
from core.classifier import classify_email, rule_based_classify
from sqlalchemy.orm import Session

def get_body(msg):
    from bs4 import BeautifulSoup
    html_body = ""
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            
            if content_type == "text/plain" and "attachment" not in content_disposition:
                return part.get_payload(decode=True).decode(errors="ignore")
            elif content_type == "text/html" and "attachment" not in content_disposition:
                html_body = part.get_payload(decode=True).decode(errors="ignore")
    else:
        content_type = msg.get_content_type()
        if content_type == "text/plain":
            return msg.get_payload(decode=True).decode(errors="ignore")
        elif content_type == "text/html":
            html_body = msg.get_payload(decode=True).decode(errors="ignore")

    if html_body:
        # Convert HTML to clean text
        soup = BeautifulSoup(html_body, 'html.parser')
        # Remove script and style elements
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()
        return soup.get_text(separator='\n', strip=True)
        
    return ""

def fetch_imap_emails():
    init_db()
    db: Session = SessionLocal()
    
    # Get ALL accounts from DB
    try:
        accounts = db.query(Account).all()
    except Exception as e:
        print(f"Database error: {e}")
        db.close()
        return
    
    if not accounts:
        print("No IMAP Accounts found in database. Skipping IMAP sync.")
        db.close()
        return

    # RUN CLEANUP ONCE BEFORE STARTING ALL IMAP SYNCS
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=2)
    deleted = db.query(Email).filter(Email.timestamp < cutoff, Email.is_pinned == 0).delete()
    if deleted: 
        print(f"  [CLEANUP] Removed {deleted} old emails before IMAP sync.")
        db.commit()

    for account in accounts:
        print(f"Starting IMAP Sync for {account.email} ({account.label})...")

        # Determine IMAP server
        imap_server = "imap.gmail.com" # Default
        if "@outlook" in account.email or "@hotmail" in account.email:
            imap_server = "outlook.office365.com"
        elif "@yahoo" in account.email:
            imap_server = "imap.mail.yahoo.com"
        
        try:
            # Connect to determined IMAP server
            mail = imaplib.IMAP4_SSL(imap_server)
            mail.login(account.email, account.password)
            mail.select("inbox")

            # Revert to 2 days as requested
            date = (datetime.date.today() - datetime.timedelta(2)).strftime("%d-%b-%Y")
            status, messages = mail.search(None, f'(SINCE "{date}")')
            
            # (Cleanup logic moved to sync_all_imap_accounts to prevent DB locking)
            
            if status != "OK":
                print(f"IMAP Search Failed for {account.email}.")
                continue

            message_ids = messages[0].split()
            print(f"IMAP: Found {len(message_ids)} potential messages for {account.email}.")

            for msg_id in reversed(message_ids): # Process newest first
                try:
                    res, msg_data = mail.fetch(msg_id, "(RFC822)")
                    if res != "OK": continue

                    for response_part in msg_data:
                        if isinstance(response_part, tuple):
                            raw_email = response_part[1]
                            msg = email.message_from_bytes(raw_email)
                            
                            # Decode Subject early for logging
                            subject_header = decode_header(msg.get("Subject", "No Subject"))[0]
                            subject = subject_header[0]
                            if isinstance(subject, bytes):
                                subject = subject.decode(subject_header[1] if subject_header[1] else "utf-8", errors="ignore")
                            
                            safe_subject = subject.encode('ascii', 'ignore').decode('ascii')
                            print(f"Checking: {safe_subject[:50]}")

                            # Unique ID
                            msg_uid = msg.get("Message-ID")
                            if not msg_uid:
                                msg_uid = f"imap_{msg_id.decode()}_{msg.get('Date')}"
                            
                            existing = db.query(Email).filter(Email.id == msg_uid).first()
                            if existing: 
                                print(f"  -> Already in DB.")
                                continue

                            sender = msg.get("From", "Unknown")
                            body = get_body(msg)
                            snippet = (body[:200] + "...") if body else msg.get("Snippet", "")
                            
                            # QUICK CLASSIFICATION (Rules Only - Instant)
                            category, importance = rule_based_classify(subject, snippet)
                            if not category:
                                category, importance = "General", 5
                                summary = "AI analysis pending..."
                                ai_processed = 0
                            else:
                                summary = "Categorized by Rules."
                                ai_processed = 1

                            # Extract Date
                            import dateutil.parser
                            from datetime import timezone
                            date_str = msg.get("Date")
                            email_ts = None
                            if date_str:
                                try:
                                    email_ts = dateutil.parser.parse(date_str)
                                    if email_ts.tzinfo is None:
                                        email_ts = email_ts.replace(tzinfo=timezone.utc)
                                    else:
                                        email_ts = email_ts.astimezone(timezone.utc)
                                except:
                                    pass

                            new_email = Email(
                                id=msg_uid,
                                sender=sender,
                                subject=subject,
                                snippet=snippet,
                                body=body,
                                category=category,
                                importance=importance,
                                summary=summary,
                                source_email=account.email,
                                timestamp=email_ts,
                                ai_processed=ai_processed
                            )
                            db.add(new_email)
                            print(f"  [OK] Synced successfully.")

                    db.commit()
                except Exception as msg_e:
                    print(f"  [ERROR] Message {msg_id}: {msg_e}")
                    db.rollback()

            mail.logout()

        except Exception as e:
            error_msg = str(e)
            if "LOGIN failed" in error_msg:
                print(f"  [AUTH ERROR] Login failed for {account.email}. Check credentials or use App Password.")
            elif "getaddrinfo failed" in error_msg:
                print(f"  [CONNECTION ERROR] Could not reach server {imap_server} for {account.email}.")
            else:
                print(f"  [ERROR] {account.email}: {error_msg}")
            db.rollback()

    db.close()
    print("Multi-Account Sync Complete.")

if __name__ == "__main__":
    fetch_imap_emails()
