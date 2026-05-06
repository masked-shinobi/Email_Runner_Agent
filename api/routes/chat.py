from fastapi import APIRouter
from core.database import SessionLocal, Email
import requests
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/")
def chat_with_inbox(data: dict):
    user_query = data.get("message", "What's in my inbox?")

    db = SessionLocal()
    
    # 1. Basic Keyword Search
    # Extract potential keywords (longer than 3 chars)
    keywords = [word.strip(",.?!") for word in user_query.split() if len(word) > 3]
    
    search_results = []
    if keywords:
        from sqlalchemy import or_
        filters = []
        for kw in keywords:
            filters.append(Email.subject.ilike(f"%{kw}%"))
            filters.append(Email.sender.ilike(f"%{kw}%"))
            filters.append(Email.summary.ilike(f"%{kw}%"))
        
        search_results = db.query(Email).filter(or_(*filters)).order_by(Email.timestamp.desc()).limit(20).all()

    # 2. Most Recent Context
    recent_emails = db.query(Email).order_by(Email.timestamp.desc()).limit(20).all()
    
    # 3. Combine and Deduplicate
    all_context_emails = {e.id: e for e in (search_results + recent_emails)}.values()
    # Sort by time
    sorted_emails = sorted(all_context_emails, key=lambda x: x.timestamp or datetime.now(), reverse=True)
    
    db.close()

    context = "\n".join([
        f"- From: {e.sender} | Subject: {e.subject} | Summary: {e.summary}" 
        for e in sorted_emails
    ])

    prompt = f"""
    You are an AI Email Assistant. You have access to the user's most relevant and recent emails.
    
    INSTRUCTIONS:
    1. Scan the USER CONTEXT below for any mention of the user's question.
    2. If you find relevant emails, summarize them for the user.
    3. If you CANNOT find any relevant emails in the context, clearly state: "I don't see any emails regarding that in my current view."
    4. Be specific. Mention the sender and the date/time if possible.

    USER CONTEXT:
    {context}

    USER QUESTION: {user_query}

    RESPONSE:
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1, 
                    "num_ctx": 8192     
                }
            },
            timeout=30
        )
        return {"response": response.json().get("response", "No response from AI.")}
    except Exception as e:
        return {"error": f"Failed to connect to Ollama: {str(e)}"}
