from core.database import SessionLocal, Email, Account

db = SessionLocal()
print("--- ACCOUNTS ---")
accounts = db.query(Account).all()
for a in accounts:
    print(f"ID: {a.id}, Email: {a.email}, Label: {a.label}")

print("\n--- GOOGLE TOKENS ---")
import os
if os.path.exists('tokens'):
    print(os.listdir('tokens'))
else:
    print("No tokens directory")

print("\n--- EMAIL COUNTS PER SOURCE ---")
from sqlalchemy import func
counts = db.query(Email.source_email, func.count(Email.id)).group_by(Email.source_email).all()
for source, count in counts:
    print(f"Source: {source}, Count: {count}")

db.close()
