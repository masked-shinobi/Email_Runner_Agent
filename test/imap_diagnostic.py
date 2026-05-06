import imaplib
import getpass

def test_imap_connection():
    print("\n--- 🔍 IMAP Diagnostic Tool ---")
    print("This script tests if your email provider (SRM/Google) allows IMAP connections.\n")
    
    email_addr = input("Enter your email (e.g., sb8879@srmist.edu.in): ").strip()
    # Use getpass to hide password input in terminal
    app_password = getpass.getpass("Enter your 16-character App Password: ").replace(" ", "")

    print(f"\n🚀 Attempting to connect to imap.gmail.com...")
    
    try:
        # 1. Attempt Connection
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        print("✅ Connection to server successful.")

        # 2. Attempt Login
        print(f"🔑 Attempting login for {email_addr}...")
        mail.login(email_addr, app_password)
        print("\n🎉 SUCCESS! IMAP is allowed for this account.")
        
        # 3. List Folders as a final check
        status, folders = mail.list()
        if status == "OK":
            print(f"📂 Found {len(folders)} mail folders.")
        
        mail.logout()

    except imaplib.IMAP4.error as e:
        print(f"\n❌ LOGIN FAILED: {e}")
        print("\nPossible reasons:")
        print("1. App Password is incorrect.")
        print("2. IMAP is not enabled in Gmail Settings.")
        print("3. SRM has blocked external IMAP bots.")
        
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    test_imap_connection()
