from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Email(Base):
    __tablename__ = 'emails'

    id = Column(String, primary_key=True) # Gmail Message ID or IMAP ID
    thread_id = Column(String)
    sender = Column(String)
    subject = Column(String)
    snippet = Column(Text)
    body = Column(Text)
    category = Column(String, default="General") # Exam, Fees, Social, etc.
    summary = Column(Text) # AI generated summary
    importance = Column(Integer, default=0) # 0-10
    source_email = Column(String) # Track which account this belongs to
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0) # 0 for unread, 1 for read
    is_pinned = Column(Integer, default=0) # 0 for normal, 1 for "Stay" (don't delete)
    ai_processed = Column(Integer, default=0) # 0 for pending, 1 for done

class Config(Base):
    __tablename__ = 'config'
    key = Column(String, primary_key=True)
    value = Column(String)

class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True)
    password = Column(String)
    label = Column(String) # e.g., "SRM", "Work", etc.

# Setup the engine and session
SQLALCHEMY_DATABASE_URL = "sqlite:///./emails.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 30}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Done: Database initialized (emails.db)")

if __name__ == "__main__":
    init_db()
