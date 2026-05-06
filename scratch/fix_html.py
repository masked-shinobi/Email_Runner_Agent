from core.database import SessionLocal, Email
from bs4 import BeautifulSoup
import re

def clean_html(text):
    if not text: return ""
    if "<html" in text.lower() or "<div" in text.lower() or "<p" in text.lower():
        soup = BeautifulSoup(text, 'html.parser')
        for s in soup(["script", "style"]):
            s.decompose()
        return soup.get_text(separator='\n', strip=True)
    return text

db = SessionLocal()
emails = db.query(Email).all()
count = 0

print(f"Checking {len(emails)} emails for HTML content...")

for e in emails:
    cleaned = clean_html(e.body)
    if cleaned != e.body:
        e.body = cleaned
        count += 1

db.commit()
db.close()
print(f"Successfully cleaned HTML from {count} existing emails.")
