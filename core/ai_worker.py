import time
from core.database import SessionLocal, Email
from core.classifier import ai_classify

def process_pending_emails():
    """Finds emails with ai_processed=0 and runs AI classification on them."""
    db = SessionLocal()
    try:
        pending = db.query(Email).filter(Email.ai_processed == 0).all()
        if not pending:
            return 0
            
        print(f"  [AI WORKER] Processing {len(pending)} pending emails...")
        
        count = 0
        for email in pending:
            try:
                # Run AI classification
                category, importance, summary = ai_classify(email.subject, email.snippet)
                
                # Update email record
                email.category = category
                email.importance = importance
                email.summary = summary
                email.ai_processed = 1
                
                count += 1
                if count % 5 == 0:
                    db.commit() # Commit in batches
                    print(f"  [AI WORKER] Progress: {count}/{len(pending)}")
                    
            except Exception as e:
                print(f"  [AI WORKER] Error processing email {email.id}: {e}")
        
        db.commit()
        print(f"  [AI WORKER] Completed processing {count} emails.")
        return count
        
    finally:
        db.close()

if __name__ == "__main__":
    process_pending_emails()
