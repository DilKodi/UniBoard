from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from fastapi.staticfiles import StaticFiles
import os
from .routers import auth, users, listings, admin, rooms, owners, reviews

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
        try:
            conn.execute(text("ALTER TABLE boarding_places ADD COLUMN latitude FLOAT"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE boarding_places ADD COLUMN longitude FLOAT"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE reviews ADD COLUMN reviewer_role VARCHAR DEFAULT 'student'"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE reviews ADD COLUMN reviewer_name VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE reviews ADD COLUMN reviewer_email VARCHAR"))
        except Exception:
            pass

    # Backfill coordinates for existing boarding places
    import time
    from .database import SessionLocal
    from .models import BoardingPlace
    from .utils import geocode_address, get_university_fallback_coords
    
    db = SessionLocal()
    try:
        unlocated = db.query(BoardingPlace).filter(
            (BoardingPlace.latitude == None) | (BoardingPlace.longitude == None)
        ).all()
        if unlocated:
            print(f"Found {len(unlocated)} boarding places without coordinates. Geocoding...")
            for bp in unlocated:
                lat, lon = geocode_address(bp.address)
                if lat is not None and lon is not None:
                    bp.latitude = lat
                    bp.longitude = lon
                    db.add(bp)
                    db.commit()
                    print(f"Geocoded: '{bp.property_name}' to {lat}, {lon}")
                else:
                    # Fallback to nearest university coordinates
                    flat, flon = get_university_fallback_coords(bp.nearest_university)
                    bp.latitude = flat
                    bp.longitude = flon
                    db.add(bp)
                    db.commit()
                    print(f"Fallback coordinates for: '{bp.property_name}' to {flat}, {flon}")
                time.sleep(1)
    except Exception as e:
        print(f"Error during backfill: {e}")
    finally:
        db.close()

# Mount uploads directory to serve static files
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(admin.router)
app.include_router(rooms.router)
app.include_router(owners.router)
app.include_router(reviews.router)