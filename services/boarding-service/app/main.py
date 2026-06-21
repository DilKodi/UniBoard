import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import time
from sqlalchemy.exc import OperationalError
from .database import engine, Base
from .routes import boardings, rooms, images

# Create database tables with retry logic
for attempt in range(30):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except OperationalError:
        if attempt == 29:
            raise
        time.sleep(2)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="UniBoard Boarding Service", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "boarding"}

app.include_router(boardings.router)
app.include_router(rooms.router)
app.include_router(images.router)
