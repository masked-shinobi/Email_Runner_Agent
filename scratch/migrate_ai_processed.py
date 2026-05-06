from core.database import engine
import sqlalchemy

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE emails ADD COLUMN ai_processed INTEGER DEFAULT 0"))
            conn.commit()
            print("Successfully added ai_processed column to emails table.")
        except Exception as e:
            print(f"Migration error (might already exist): {e}")

if __name__ == "__main__":
    migrate()
