from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Email(Base):
    __tablename__ = 'emails'

    id = Column(String, primary_key=True) # Gmail Message ID
    thread_id = Column(String)
    sender = Column(String)
    subject = Column(String)
    snippet = Column(Text)
    body = Column(Text)
    category = Column(String, default="General") # Exam, Fees, Social, etc.
    summary = Column(Text) # AI generated summary
    importance = Column(Integer, default=0) # 0-10
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0) # 0 for unread, 1 for read

# Setup the engine and session
engine = create_engine('sqlite:///emails.db')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Done: Database initialized (emails.db)")

if __name__ == "__main__":
    init_db()
