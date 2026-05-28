import os
from datetime import datetime

import httpx  # type: ignore[import-not-found]
from fastapi import FastAPI, File, Form, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware


def _origin_list(default: str) -> list[str]:
    origins_env = os.getenv("CORS_ORIGINS", default)
    return [origin.strip() for origin in origins_env.split(",") if origin.strip()]


AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
BOARDING_SERVICE_URL = os.getenv("BOARDING_SERVICE_URL", "http://boarding-service:8003")


app = FastAPI(title=os.getenv("GATEWAY_NAME", "UniBoard API Gateway"), version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origin_list("http://localhost:5173,http://localhost:5174,http://localhost:3000"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _filtered_headers(request: Request) -> dict[str, str]:
    excluded_headers = {"host", "content-length", "connection", "accept-encoding"}
    headers: dict[str, str] = {}
    for key, value in request.headers.items():
        if key.lower() in excluded_headers:
            continue
        headers[key] = value
    return headers


async def _proxy(request: Request, target_base_url: str, upstream_path: str) -> Response:
    upstream_url = f"{target_base_url.rstrip('/')}" f"{upstream_path}"
    if request.url.query:
        upstream_url = f"{upstream_url}?{request.url.query}"

    body = await request.body()
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        upstream_response = await client.request(
            request.method,
            upstream_url,
            content=body if body else None,
            headers=_filtered_headers(request),
        )

    headers = {}
    content_type = upstream_response.headers.get("content-type")
    if content_type:
        headers["content-type"] = content_type

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=headers,
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "gateway"}


@app.api_route("/signup", methods=["POST", "OPTIONS"])
async def signup(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, AUTH_SERVICE_URL, "/signup")


@app.api_route("/login", methods=["POST", "OPTIONS"])
async def login(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, AUTH_SERVICE_URL, "/login")


@app.api_route("/users/me", methods=["GET", "OPTIONS"])
async def user_me(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, AUTH_SERVICE_URL, "/users/me")


@app.api_route("/listings/upload", methods=["POST", "OPTIONS"])
async def upload_listing_document(request: Request, file: UploadFile = File(None)):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    upload = file or (await request.form()).get("file")
    if not isinstance(upload, UploadFile):
        return Response(content='{"detail":"file is required"}', media_type="application/json", status_code=422)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_name = f"{timestamp}_{upload.filename}"
    return Response(
        content=f'{{"filename":"{safe_name}"}}',
        media_type="application/json",
        status_code=200,
    )


@app.api_route("/listings", methods=["GET", "POST", "OPTIONS"])
async def listings(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, "/boardings")


@app.api_route("/listings/mine", methods=["GET", "OPTIONS"])
async def my_listings(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        me_response = await client.get(
            f"{AUTH_SERVICE_URL.rstrip('/')}/users/me",
            headers=_filtered_headers(request),
        )

        if me_response.status_code != 200:
            return Response(
                content=me_response.content,
                status_code=me_response.status_code,
                headers={"content-type": me_response.headers.get("content-type", "application/json")},
            )

        user = me_response.json()
        owner_id = user.get("id")
        if owner_id is None:
            return Response(content='{"detail":"Owner id missing"}', media_type="application/json", status_code=400)

        listings_response = await client.get(
            f"{BOARDING_SERVICE_URL.rstrip('/')}/boardings/owner/{owner_id}",
            headers=_filtered_headers(request),
        )

    headers = {}
    content_type = listings_response.headers.get("content-type")
    if content_type:
        headers["content-type"] = content_type

    return Response(
        content=listings_response.content,
        status_code=listings_response.status_code,
        headers=headers,
    )


@app.api_route("/listings/{listing_id}", methods=["GET", "PUT", "DELETE", "OPTIONS"])
async def listing_detail(request: Request, listing_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, f"/boardings/{listing_id}")

@app.get("/routes")
def list_routes():
    return {
        "auth": os.getenv("AUTH_SERVICE_URL", ""),
        "student": os.getenv("STUDENT_SERVICE_URL", ""),
        "boarding": os.getenv("BOARDING_SERVICE_URL", ""),
        "booking": os.getenv("BOOKING_SERVICE_URL", ""),
        "review": os.getenv("REVIEW_SERVICE_URL", ""),
        "notification": os.getenv("NOTIFICATION_SERVICE_URL", ""),
        "admin": os.getenv("ADMIN_SERVICE_URL", ""),
    }
