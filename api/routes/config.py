from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import SessionLocal, Config, Account

router = APIRouter(prefix="/config", tags=["Config"])

class IMAPAccount(BaseModel):
    email: str
    password: str
    label: str = "Work"

@router.post("/accounts")
def add_account(data: IMAPAccount):
    db = SessionLocal()
    try:
        existing = db.query(Account).filter(Account.email == data.email).first()
        if existing:
            existing.password = data.password
            existing.label = data.label
        else:
            db.add(Account(email=data.email, password=data.password, label=data.label))
        db.commit()
        return {"status": "Account saved"}
    finally:
        db.close()

@router.get("/accounts")
def list_accounts():
    db = SessionLocal()
    try:
        accounts = db.query(Account).all()
        return [{"email": a.email, "label": a.label} for a in accounts]
    finally:
        db.close()

@router.delete("/accounts/{email}")
def delete_account(email: str):
    db = SessionLocal()
    try:
        account = db.query(Account).filter(Account.email == email).first()
        if account:
            db.delete(account)
            db.commit()
            return {"status": "Account deleted"}
        return {"status": "Account not found"}
    finally:
        db.close()

@router.post("/google-login")
def trigger_google_login():
    from core.setup_gmail import get_gmail_service
    try:
        # Calling without email will trigger the login flow for a new account
        service = get_gmail_service()
        if service:
            return {"status": "Google Account Linked Successfully"}
        return {"status": "Failed to link account"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/google-accounts/{email}")
def delete_google_account(email: str):
    import os
    token_path = os.path.join("tokens", f"{email}.json")
    if os.path.exists(token_path):
        os.remove(token_path)
        return {"status": "Google account removed"}
    return {"status": "Account not found"}

@router.get("/status")
def get_status():
    db = SessionLocal()
    try:
        from core.setup_gmail import list_google_accounts
        google_accounts = list_google_accounts()
        accounts = db.query(Account).all()
        return {
            "google_connected": len(google_accounts) > 0,
            "google_accounts": google_accounts,
            "imap_accounts": [{"email": a.email, "label": a.label} for a in accounts]
        }
    finally:
        db.close()
