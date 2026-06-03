from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, users, listings, admin

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


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to UniBoard API"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(admin.router)