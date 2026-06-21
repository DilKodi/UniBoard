import os
from datetime import datetime

import httpx  # type: ignore[import-not-found]
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


def _origin_list(default: str) -> list[str]:
    origins_env = os.getenv("CORS_ORIGINS", default)
    return [origin.strip() for origin in origins_env.split(",") if origin.strip()]


AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
BOARDING_SERVICE_URL = os.getenv("BOARDING_SERVICE_URL", "http://boarding-service:8003")
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8004")
REVIEW_SERVICE_URL = os.getenv("REVIEW_SERVICE_URL", "http://review-service:8005")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")



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
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            upstream_response = await client.request(
                request.method,
                upstream_url,
                content=body if body else None,
                headers=_filtered_headers(request),
            )
    except httpx.RequestError:
        service_name = upstream_path.strip("/").split("/")[0] or "upstream"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": f"{service_name} service is unavailable"},
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


async def _proxy_with_auth(request: Request, target_base_url: str, upstream_path: str) -> Response:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        me_response = await client.get(
            f"{AUTH_SERVICE_URL.rstrip('/')}/users/me",
            headers=_filtered_headers(request),
        )
        if me_response.status_code != 200:
            return Response(
                content=me_response.content,
                status_code=me_response.status_code,
                headers={"content-type": me_response.headers.get("content-type", "application/json")}
            )
        user = me_response.json()
        user_id = user.get("id")
        user_role = user.get("role", "")
        user_email = user.get("email", "")

        user_name = ""
        if user_role == "student" and user.get("student_profile"):
            user_name = user["student_profile"].get("full_name", "")
        elif user_role == "owner" and user.get("owner_profile"):
            user_name = user["owner_profile"].get("full_name", "")

    upstream_url = f"{target_base_url.rstrip('/')}{upstream_path}"
    if request.url.query:
        upstream_url = f"{upstream_url}?{request.url.query}"

    body = await request.body()
    headers = _filtered_headers(request)
    headers["X-User-Id"] = str(user_id)
    headers["X-User-Role"] = str(user_role)
    headers["X-User-Name"] = str(user_name)
    headers["X-User-Email"] = str(user_email)

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            upstream_response = await client.request(
                request.method,
                upstream_url,
                content=body if body else None,
                headers=headers,
            )
    except httpx.RequestError:
        service_name = upstream_path.strip("/").split("/")[0] or "upstream"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": f"{service_name} service is unavailable"},
        )

    resp_headers = {}
    content_type = upstream_response.headers.get("content-type")
    if content_type:
        resp_headers["content-type"] = content_type

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=resp_headers,
    )


async def _require_admin(request: Request) -> Response | None:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        profile_response = await client.get(
            f"{AUTH_SERVICE_URL.rstrip('/')}/users/me",
            headers=_filtered_headers(request),
        )

    if profile_response.status_code != 200:
        headers = {}
        content_type = profile_response.headers.get("content-type")
        if content_type:
        	headers["content-type"] = content_type
        return Response(
            content=profile_response.content,
            status_code=profile_response.status_code,
            headers=headers,
        )

    profile = profile_response.json()
    if profile.get("role") != "admin":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Admin access required"},
        )

    return None

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


@app.api_route("/owners/{owner_id}", methods=["GET", "OPTIONS"])
async def owner_profile(request: Request, owner_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, AUTH_SERVICE_URL, f"/owners/{owner_id}")


@app.api_route("/listings/upload", methods=["POST", "OPTIONS"])
async def upload_listing_document(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, "/boardings/upload")


@app.api_route("/uploads/{file_path:path}", methods=["GET", "OPTIONS"])
async def uploaded_file(request: Request, file_path: str):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, f"/uploads/{file_path}")


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


@app.api_route("/listings/{listing_id}/images", methods=["GET", "POST", "OPTIONS"])
async def listing_images(request: Request, listing_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, f"/boardings/{listing_id}/images")


@app.api_route("/listings/{listing_id}/images/{image_id}", methods=["DELETE", "OPTIONS"])
async def delete_listing_image(request: Request, listing_id: int, image_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, f"/boardings/{listing_id}/images/{image_id}")


@app.api_route("/admin/listings/pending", methods=["GET", "OPTIONS"])
async def admin_pending_listings(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    admin_check = await _require_admin(request)
    if admin_check is not None:
        return admin_check

    return await _proxy(request, BOARDING_SERVICE_URL, "/boardings/admin/listings/pending")


@app.api_route("/admin/listings/{listing_id}/approve", methods=["POST", "OPTIONS"])
async def admin_approve_listing(request: Request, listing_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    admin_check = await _require_admin(request)
    if admin_check is not None:
        return admin_check

    return await _proxy(request, BOARDING_SERVICE_URL, f"/boardings/admin/listings/{listing_id}/approve")


@app.api_route("/admin/listings/{listing_id}/reject", methods=["POST", "OPTIONS"])
async def admin_reject_listing(request: Request, listing_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    admin_check = await _require_admin(request)
    if admin_check is not None:
        return admin_check

    return await _proxy(request, BOARDING_SERVICE_URL, f"/boardings/admin/listings/{listing_id}/reject")


@app.api_route("/admin/listings/{listing_id}/reset", methods=["POST", "OPTIONS"])
async def admin_reset_listing(request: Request, listing_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    admin_check = await _require_admin(request)
    if admin_check is not None:
        return admin_check

    return await _proxy(request, BOARDING_SERVICE_URL, f"/boardings/admin/listings/{listing_id}/reset")


@app.api_route("/users/me/student", methods=["PUT", "OPTIONS"])
async def update_student_profile_route(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, AUTH_SERVICE_URL, "/users/me/student")


@app.api_route("/users/me/owner", methods=["PUT", "OPTIONS"])
async def update_owner_profile_route(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, AUTH_SERVICE_URL, "/users/me/owner")


@app.api_route("/users/profile/upload", methods=["POST", "OPTIONS"])
async def upload_profile_picture_route(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, "/boardings/profile/upload")



@app.api_route("/rooms", methods=["GET", "POST", "OPTIONS"])
async def rooms_root_route(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, "/rooms")


@app.api_route("/rooms/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def rooms_sub_route(request: Request, path: str):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOARDING_SERVICE_URL, f"/rooms/{path}")


@app.api_route("/bookings/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def bookings_route(request: Request, path: str):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, BOOKING_SERVICE_URL, f"/bookings/{path}")


@app.api_route("/reviews/property/{property_id}/summary", methods=["GET", "OPTIONS"])
async def property_summary_route(request: Request, property_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, REVIEW_SERVICE_URL, f"/reviews/property/{property_id}/summary")


@app.api_route("/reviews/property/{property_id}", methods=["GET", "OPTIONS"])
async def property_reviews_route(request: Request, property_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy(request, REVIEW_SERVICE_URL, f"/reviews/property/{property_id}")


@app.api_route("/reviews/{review_id}/visibility", methods=["PATCH", "OPTIONS"])
async def toggle_visibility_route(request: Request, review_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    admin_check = await _require_admin(request)
    if admin_check is not None:
        return admin_check
    return await _proxy(request, REVIEW_SERVICE_URL, f"/reviews/{review_id}/visibility")


@app.api_route("/reviews/{review_id}/reply", methods=["POST", "OPTIONS"])
async def reply_to_review_route(request: Request, review_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, REVIEW_SERVICE_URL, f"/reviews/{review_id}/reply")


@app.api_route("/reviews/{review_id}/media/{media_id}", methods=["DELETE", "OPTIONS"])
async def delete_review_media_route(request: Request, review_id: int, media_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, REVIEW_SERVICE_URL, f"/reviews/{review_id}/media/{media_id}")


@app.api_route("/reviews/{review_id}/media", methods=["POST", "OPTIONS"])
async def upload_review_media_route(request: Request, review_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, REVIEW_SERVICE_URL, f"/reviews/{review_id}/media")


@app.api_route("/reviews/{review_id}", methods=["PATCH", "DELETE", "OPTIONS"])
async def manage_review_route(request: Request, review_id: int):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, REVIEW_SERVICE_URL, f"/reviews/{review_id}")


@app.api_route("/reviews", methods=["POST", "OPTIONS"])
async def create_review_route(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, REVIEW_SERVICE_URL, "/reviews/")


@app.api_route("/notifications", methods=["GET", "OPTIONS"])
async def get_notifications_route(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, NOTIFICATION_SERVICE_URL, "/notifications")


@app.api_route("/notifications/{path:path}", methods=["PATCH", "DELETE", "OPTIONS"])
async def modify_notification_route(request: Request, path: str):
    if request.method == "OPTIONS":
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return await _proxy_with_auth(request, NOTIFICATION_SERVICE_URL, f"/notifications/{path}")


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
