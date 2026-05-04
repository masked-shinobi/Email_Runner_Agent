from fastapi import APIRouter
from core.database import SessionLocal, Email

router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("/")
def get_all_emails():
    db = SessionLocal()
    emails = db.query(Email).order_by(Email.timestamp.desc()).all()
    db.close()
    return emails

@router.get("/important")
def get_important():
    db = SessionLocal()
    emails = db.query(Email).filter(Email.importance >= 8).order_by(Email.timestamp.desc()).all()
    db.close()
    return emails
