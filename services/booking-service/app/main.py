from fastapi import FastAPI

app = FastAPI(title="UniBoard Booking Service", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "booking"}

@app.get("/bookings")
def list_bookings():
    return {"items": [], "message": "Booking service placeholder"}
