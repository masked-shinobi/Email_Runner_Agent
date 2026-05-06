import re
import requests
import json

# High priority keywords
KEYWORDS_ACADEMIC = [
    r"exam", r"deadline", r"fees", r"hall ticket", 
    r"admit card", r"schedule", r"viva", r"submission", r"official announcement",
    r"university", r"college", r"department"
]

KEYWORDS_PLACEMENT = [
    r"placement", r"interview", r"shortlisted", r"registration", r"hackwithinfy"
]

def rule_based_classify(subject, snippet):
    """Returns (category, importance) if match found, else (None, None)."""
    text = (subject + " " + snippet).lower()
    
    # Check Placement first
    for pattern in KEYWORDS_PLACEMENT:
        if re.search(pattern, text):
            return "Placement", 10
            
    # Check Academic
    for pattern in KEYWORDS_ACADEMIC:
        if re.search(pattern, text):
            return "Urgent/Academic", 9
            
    # Simple rule for social/promotions
    if any(word in text for word in ["offer", "sale", "discount", "subscribe"]):
        return "Promotion", 2

    return None, None

def ai_classify(subject, snippet):
    """Call Ollama for advanced classification and summarization."""
    prompt = f"""
    Email: {subject} | {snippet}
    Classify for a student. Priority (0-10), Category (Placement, Exam, Important, General, Spam), Summary (1-sentence).
    Return JSON: {{"priority": int, "category": string, "summary": string}}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma3:1b",
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "num_predict": 128,
                    "temperature": 0.3
                }
            },
            timeout=20
        )
        
        if response.status_code == 200:
            result_text = response.json().get("response", "")
            data = json.loads(result_text)
            return (
                data.get("category", "General"),
                data.get("priority", 5),
                data.get("summary", "No summary provided.")
            )
    except Exception as e:
        print(f"AI Classification Error: {e}")
    
    return "General", 5, "Could not generate summary."

def classify_email(subject, snippet):
    """Main entry point: Rule Engine -> LLM fallback."""
    category, importance = rule_based_classify(subject, snippet)
    
    if category:
        return category, importance, "Categorized by Rules."
    
    # Fallback to AI
    return ai_classify(subject, snippet)
