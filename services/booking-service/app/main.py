from fastapi import FastAPI
import time
from sqlalchemy.exc import OperationalError
from .database import engine, Base
from .routes import requests

# Create database tables with retry logic (same as auth-service)
for attempt in range(30):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except OperationalError:
        if attempt == 29:
            raise
        time.sleep(2)

app = FastAPI(title="UniBoard Booking Service", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking"}

app.include_router(requests.router)
