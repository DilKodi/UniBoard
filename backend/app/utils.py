from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt
from typing import Optional

# Security Configuration
SECRET_KEY = "your-secret-key-change-in-production"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash a password."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

UNIVERSITY_COORDINATES = {
    "University of Moratuwa": {"lat": 6.7951, "lng": 79.9008},
    "University of Colombo": {"lat": 6.9020, "lng": 79.8612},
    "University of Peradeniya": {"lat": 7.2548, "lng": 80.5987},
    "University of Sri Jayewardenepura": {"lat": 6.8529, "lng": 79.9021},
    "Sri Lanka Institute of Information Technology": {"lat": 6.9064, "lng": 79.9706},
    "NSBM Green University": {"lat": 6.8213, "lng": 80.0416},
    "APIIT Sri Lanka": {"lat": 6.9189, "lng": 79.8530},
    "Informatics Institute of Technology": {"lat": 6.9634, "lng": 79.8703},
    "University of Kelaniya": {"lat": 6.9741, "lng": 79.9161},
    "Open University of Sri Lanka": {"lat": 6.8824, "lng": 79.8825},
}

def get_university_fallback_coords(uni_name: str) -> tuple[float, float]:
    """Get fallback coordinates for a university if geocoding fails."""
    for key, coords in UNIVERSITY_COORDINATES.items():
        if key.lower() in uni_name.lower():
            return coords["lat"], coords["lng"]
    return 7.8731, 80.7718  # default center of Sri Lanka

def geocode_address(address: str) -> tuple[float | None, float | None]:
    """Geocode an address string to latitude and longitude using Nominatim."""
    import urllib.request
    import urllib.parse
    import json
    
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(address)}&format=json&limit=1"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "UniBoardApp/1.0 (contact@uniboard.lk)"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if data and len(data) > 0:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Backend geocoding failed for '{address}': {e}")
    return None, None
