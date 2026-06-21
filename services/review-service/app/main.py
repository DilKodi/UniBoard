from fastapi import FastAPI
import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from .database import engine, Base
from .routers import reviews

# Create database tables with retry logic (same as booking-service)
for attempt in range(30):
    try:
        Base.metadata.create_all(bind=engine)
        with engine.begin() as conn:
            # Add reviewer_role column if it doesn't exist
            conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_role VARCHAR NOT NULL DEFAULT 'student';"))
            conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR;"))
            conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_email VARCHAR;"))
            # Recreate constraint to allow both to be NULL (general review)
            conn.execute(text("ALTER TABLE reviews DROP CONSTRAINT IF EXISTS chk_booking_or_visit;"))
            conn.execute(text("ALTER TABLE reviews ADD CONSTRAINT chk_booking_or_visit CHECK (NOT (booking_id IS NOT NULL AND visit_id IS NOT NULL));"))
        break
    except OperationalError:
        if attempt == 29:
            raise
        time.sleep(2)

app = FastAPI(title="UniBoard Review Service", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "review"}

app.include_router(reviews.router)
