from fastapi import FastAPI

app = FastAPI(title="UniBoard Notification Service", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "notification"}

@app.get("/notifications")
def list_notifications():
    return {"items": [], "message": "Notification service placeholder"}
