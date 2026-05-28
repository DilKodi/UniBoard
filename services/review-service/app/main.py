from fastapi import FastAPI

app = FastAPI(title="UniBoard Review Service", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "review"}

@app.get("/reviews")
def list_reviews():
    return {"items": [], "message": "Review service placeholder"}
