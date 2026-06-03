import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from . import database, models, utils
from .routers import auth, owners, users

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


def ensure_default_admin() -> None:
    admin_email = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    db = database.SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()

        if admin_user is None:
            db.add(
                models.User(
                    email=admin_email,
                    hashed_password=utils.get_password_hash(admin_password),
                    role=models.UserRole.ADMIN,
                    is_active=True,
                    is_verified=True,
                )
            )
            db.commit()
            return

        if admin_user.role != models.UserRole.ADMIN:
            admin_user.role = models.UserRole.ADMIN
            admin_user.is_active = True
            admin_user.is_verified = True
            db.commit()
    finally:
        db.close()

@app.on_event("startup")
def on_startup() -> None:
    # Retry until PostgreSQL is ready so the container does not exit during compose startup.
    for attempt in range(30):
        try:
            models.Base.metadata.create_all(bind=database.engine)
            ensure_default_admin()
            return
        except OperationalError:
            if attempt == 29:
                raise
            time.sleep(2)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auth"}

app.include_router(auth.router)
app.include_router(owners.router)
app.include_router(users.router)
