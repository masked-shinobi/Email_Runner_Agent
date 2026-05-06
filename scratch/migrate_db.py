from core.database import engine
import sqlalchemy

conn = engine.connect()
try:
    conn.execute(sqlalchemy.text('ALTER TABLE emails ADD COLUMN is_pinned INTEGER DEFAULT 0'))
    conn.commit()
    print("Added column is_pinned successfully.")
except Exception as e:
    print(f"Notice: {e}")
finally:
    conn.close()
