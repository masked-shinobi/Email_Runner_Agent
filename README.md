# 📧 Mail-san: AI-Powered Email Triage

**Mail-san** is a high-speed, multi-account email management system designed for students and professionals. It uses local AI to summarize, categorize, and prioritize your inbox, ensuring you never miss a critical placement update or university deadline.

## ✨ Key Features

- **Multi-Account Sync**: Support for up to 5 accounts (Gmail via OAuth, Institutional Mail via IMAP/App Passwords).
- **Two-Phase Fast Sync**: Emails are downloaded instantly, while AI analysis (summarization/ranking) happens seamlessly in the background.
- **Local AI Brain**: Powered by Ollama (`gemma3:1b`), keeping your data private and processing lightning-fast.
- **Smart Rule Engine**: Instant categorization for **Placement** and **Academic** emails using custom regex rules.
- **Stay Feature (Pinning)**: Protect important emails from automatic cleanup.
- **Zero-Latency UI**: Frontend-based filtering and search for a snappy experience.
- **Auto-Cleanup**: Automatically keeps your inbox clean by removing non-protected emails older than 48 hours.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python), SQLite, SQLAlchemy
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons
- **AI**: Ollama (Local LLM)
- **Email**: Google Gmail API, IMAPlib

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js & npm
- Ollama (installed and running)

### 2. Setup
1. **Clone the repo**:
   ```bash
   git clone https://github.com/your-username/mail-san.git
   cd mail-san
   ```

2. **Backend Setup**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

4. **Credentials**:
   - Place your `credentials.json` (Google Cloud Console) in the root directory.

### 3. Running the App
1. **Start Backend**:
   ```bash
   uvicorn api.main:app --reload
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Open in Browser**: `http://localhost:5173`

## 🛡️ Security
- **Data Privacy**: All AI processing happens locally on your machine via Ollama.
- **Credential Protection**: `tokens/`, `credentials.json`, and `emails.db` are strictly ignored by Git.

## 📜 License
MIT
