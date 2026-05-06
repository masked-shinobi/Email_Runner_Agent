import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from core.classifier import classify_email

subject = "INFOSYS HACKWITHINFY INTERVIEW REGISTRATION"
snippet = "DEAR STUDENTS, PLEASE FIND ATTACHED THE LIST OF STUDENTS SHORTLISTED FOR THE INFOSYS HACKWITH INFY INTERVIEW PROCESS. NOTE : ALL THE SHORTLISTED STUDENTS MUST REGISTER ON THE BELOW LINK IMMEDIATELY AND COMPULSORILY."

print("Testing classification for SRM Placement email...")
category, priority, summary = classify_email(subject, snippet)

print(f"\nCategory: {category}")
print(f"Priority: {priority}")
print(f"Summary: {summary}")
