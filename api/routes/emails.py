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

@router.get("/career")
def get_career_emails():
    db = SessionLocal()
    # Filter by 'Placement' category (case-insensitive)
    emails = db.query(Email).filter(Email.category.ilike('%Placement%')).order_by(Email.timestamp.desc()).all()
    db.close()
    return emails
@router.post("/{email_id}/toggle-pin")
def toggle_pin(email_id: str):
    db = SessionLocal()
    email = db.query(Email).filter(Email.id == email_id).first()
    if email:
        email.is_pinned = 1 if email.is_pinned == 0 else 0
        db.commit()
        db.refresh(email)
        status = "pinned" if email.is_pinned == 1 else "unpinned"
        db.close()
        return {"status": "success", "is_pinned": email.is_pinned, "message": f"Email {status}"}
    db.close()
    return {"status": "error", "message": "Email not found"}
