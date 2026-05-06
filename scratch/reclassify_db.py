import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from core.database import SessionLocal, Email
from core.classifier import classify_email

def reclassify_all():
    db = SessionLocal()
    emails = db.query(Email).all()
    print(f"Re-classifying {len(emails)} emails...")
    
    updated_count = 0
    for email in emails:
        old_cat = email.category
        category, priority, summary = classify_email(email.subject, email.snippet)
        
        if category != old_cat:
            email.category = category
            email.importance = priority
            updated_count += 1
            print(f"Updated: {email.subject[:30]}... | {old_cat} -> {category}")
            
    db.commit()
    db.close()
    print(f"Done! Updated {updated_count} emails.")

if __name__ == "__main__":
    reclassify_all()
