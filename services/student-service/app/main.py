from fastapi import FastAPI

app = FastAPI(title="UniBoard Student Service", version="1.0.0")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "student"}

@app.get("/students")
def list_students():
    return {"items": [], "message": "Student service placeholder"}
