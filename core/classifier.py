import re
import requests
import json

# High priority keywords
KEYWORDS_CRITICAL = [
    r"exam", r"deadline", r"fees", r"registration", r"hall ticket", 
    r"admit card", r"schedule", r"viva", r"submission", r"official announcement",
    r"university", r"college", r"department"
]

def rule_based_classify(subject, snippet):
    """Returns (category, importance) if match found, else (None, None)."""
    text = (subject + " " + snippet).lower()
    
    for pattern in KEYWORDS_CRITICAL:
        if re.search(pattern, text):
            return "Urgent/Academic", 9
            
    # Simple rule for social/promotions
    if any(word in text for word in ["offer", "sale", "discount", "subscribe"]):
        return "Promotion", 2

    return None, None

def ai_classify(subject, snippet):
    """Call Ollama for advanced classification and summarization."""
    prompt = f"""
    You are an AI Email Assistant for a college student.
    Classify the following email and provide a short summary.

    EMAIL SUBJECT: {subject}
    EMAIL SNIPPET: {snippet}

    Return ONLY a JSON object with this exact structure:
    {{
      "priority": 0-10,
      "category": "Exam|Important|General|Spam",
      "summary": "1-sentence summary of the email"
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:1b",
                "prompt": prompt,
                "stream": False,
                "format": "json" # Ensure Ollama returns valid JSON
            },
            timeout=30
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
