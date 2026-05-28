import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="UniBoard Admin Service", version="1.0.0")

# Configure CORS origins from env `CORS_ORIGINS` (comma-separated)
# Defaults include common local dev origins including the admin dev port 5174
origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000",
)
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "admin"}


@app.get("/admin")
def admin_root():
    return {"message": "Admin service placeholder"}
