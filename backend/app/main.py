from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, users, listings, admin, rooms, owners

app = FastAPI(title="UniBoard API", version="1.0.0")

# CORS setup to allow frontend communication
origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from sqlalchemy import text

@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    # Safely alter table to add column if it doesn't exist yet
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE boarding_places ADD COLUMN gender_restriction VARCHAR"))
        except Exception:
            pass

@app.get("/")
def read_root():
    return {"message": "Welcome to UniBoard API"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(admin.router)
app.include_router(rooms.router)
app.include_router(owners.router)