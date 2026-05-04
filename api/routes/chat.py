from fastapi import APIRouter
from core.database import SessionLocal, Email
import requests

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/")
def chat_with_inbox(data: dict):
    user_query = data.get("message", "What's in my inbox?")

    db = SessionLocal()
    # Get last 10 important/recent emails for context
    emails = db.query(Email).order_by(Email.timestamp.desc()).limit(10).all()
    db.close()

    context = "\n".join([
        f"Sender: {e.sender} | Subject: {e.subject} | Summary: {e.summary}" 
        for e in emails
    ])

    prompt = f"""
    You are an AI Email Assistant. Below is the context of the user's recent emails.
    Answer the user's question based on this context.

    USER CONTEXT:
    {context}

    USER QUESTION: {user_query}

    Answer clearly and concisely.
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        return {"response": response.json().get("response", "No response from AI.")}
    except Exception as e:
        return {"error": f"Failed to connect to Ollama: {str(e)}"}
