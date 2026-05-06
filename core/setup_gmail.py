import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
TOKEN_DIR = "tokens"

def get_gmail_service(email=None):
    if not os.path.exists(TOKEN_DIR):
        os.makedirs(TOKEN_DIR)

    creds = None
    
    # If email is provided, try to load its specific token
    if email:
        token_path = os.path.join(TOKEN_DIR, f"{email}.json")
        if os.path.exists(token_path):
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # If no valid credentials found, run the flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if os.path.exists('credentials.json'):
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            else:
                print("Error: credentials.json not found.")
                return None

        # Build service to get the email address
        service = build('gmail', 'v1', credentials=creds)
        profile = service.users().getProfile(userId='me').execute()
        user_email = profile.get('emailAddress')
        
        # Save the token specifically for this email
        token_path = os.path.join(TOKEN_DIR, f"{user_email}.json")
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
        return service

    return build('gmail', 'v1', credentials=creds)

def list_google_accounts():
    accounts = []
    if os.path.exists(TOKEN_DIR):
        accounts.extend([f.replace('.json', '') for f in os.listdir(TOKEN_DIR) if f.endswith('.json')])
    
    # Check for legacy token.json and try to identify it
    if os.path.exists('token.json') and 'token' not in accounts:
        try:
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            service = build('gmail', 'v1', credentials=creds)
            profile = service.users().getProfile(userId='me').execute()
            email = profile.get('emailAddress')
            
            # Auto-migrate to tokens/ directory
            if not os.path.exists(TOKEN_DIR): os.makedirs(TOKEN_DIR)
            import shutil
            shutil.copy('token.json', os.path.join(TOKEN_DIR, f"{email}.json"))
            if email not in accounts: accounts.append(email)
        except:
            pass # Legacy token might be invalid or no internet
            
    return list(set(accounts))

if __name__ == "__main__":
    get_gmail_service()
