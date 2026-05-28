import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from . import database, models
from .routers import auth, users

app = FastAPI(title="UniBoard Auth Service", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup() -> None:
    # Retry until PostgreSQL is ready so the container does not exit during compose startup.
    for attempt in range(10):
        try:
            models.Base.metadata.create_all(bind=database.engine)
            return
        except OperationalError:
            if attempt == 9:
                raise
            time.sleep(2)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auth"}

app.include_router(auth.router)
app.include_router(users.router)
