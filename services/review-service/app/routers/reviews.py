from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import httpx
import os
import io
from uuid import uuid4

from ..database import get_db
from ..models import Review, ReviewReply, ReviewMedia
from ..schemas import ReviewCreate, ReviewReplyCreate, ReviewOut, PropertyRatingSummary, ReviewMediaOut
from ..storage import upload_file, delete_file

router = APIRouter(prefix="/reviews", tags=["reviews"])

BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8004")

ALLOWED_MEDIA_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/webm", "video/quicktime"
}
MAX_MEDIA_SIZE_MB = 20

async def verify_booking_ownership(booking_id: int, student_id: int) -> bool:
    """
    Cross-service check: confirm this booking exists,
    belongs to this student, and has status 'completed' or 'accepted'.
    """
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BOOKING_SERVICE_URL}/bookings/{booking_id}/internal", timeout=5.0)
            if resp.status_code != 200:
                return False
            booking = resp.json()
            return (
                booking.get("student_id") == student_id and
                booking.get("status") in ["completed", "accepted"]
            )
        except Exception:
            return False

async def verify_visit_ownership(visit_id: int, student_id: int) -> bool:
    """
    Cross-service check: confirm this visit exists,
    belongs to this student, and has status 'completed' or 'accepted'.
    """
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BOOKING_SERVICE_URL}/bookings/visits/{visit_id}/internal", timeout=5.0)
            if resp.status_code != 200:
                return False
            visit = resp.json()
            return (
                visit.get("student_id") == student_id and
                visit.get("status") in ["completed", "accepted"]
            )
        except Exception:
            return False


# --- Submit a review ---
@router.post("/", response_model=ReviewOut, status_code=201)
async def create_review(
    payload: ReviewCreate,
    user_id: int = Header(..., alias="X-User-Id"),
    user_role: str = Header(..., alias="X-User-Role"),
    user_name: Optional[str] = Header(None, alias="X-User-Name"),
    user_email: Optional[str] = Header(None, alias="X-User-Email"),
    db: Session = Depends(get_db)
):
    if user_role not in ["student", "owner"]:
        raise HTTPException(403, "Only registered students or boarding owners can write reviews.")

    # Check booking or visit validity cross-service
    if payload.booking_id is not None:
        valid = await verify_booking_ownership(payload.booking_id, user_id)
        if not valid:
            raise HTTPException(403, "You can only review a completed/accepted booking.")
        # Check duplicate
        existing = db.query(Review).filter_by(booking_id=payload.booking_id).first()
        if existing:
            raise HTTPException(409, "You have already reviewed this booking.")
    elif payload.visit_id is not None:
        valid = await verify_visit_ownership(payload.visit_id, user_id)
        if not valid:
            raise HTTPException(403, "You can only review a completed/accepted visit.")
        # Check duplicate
        existing = db.query(Review).filter_by(visit_id=payload.visit_id).first()
        if existing:
            raise HTTPException(409, "You have already reviewed this visit.")
    else:
        # General review: check if they have any general review or any review at all on this property
        existing = db.query(Review).filter_by(property_id=payload.property_id, student_id=user_id).first()
        if existing:
            raise HTTPException(409, "You have already reviewed this property.")

    review = Review(
        property_id=payload.property_id,
        student_id=user_id,
        reviewer_role=user_role,
        reviewer_name=user_name,
        reviewer_email=user_email,
        booking_id=payload.booking_id,
        visit_id=payload.visit_id,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# --- Get all reviews for a property ---
@router.get("/property/{property_id}", response_model=list[ReviewOut])
def get_property_reviews(
    property_id: int,
    include_hidden: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Review).filter(Review.property_id == property_id)
    if not include_hidden:
        query = query.filter(Review.is_visible == True)
    return query.order_by(Review.created_at.desc()).all()


# --- Get rating summary for a property ---
@router.get("/property/{property_id}/summary", response_model=PropertyRatingSummary)
def get_rating_summary(property_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.avg(Review.rating).label("average"),
            func.count(Review.id).label("total")
        )
        .filter_by(property_id=property_id, is_visible=True)
        .one()
    )
    return {
        "property_id"   : property_id,
        "average_rating": round(float(result.average or 0), 1),
        "total_reviews" : result.total
    }


# --- Landlord replies to a review ---
@router.post("/{review_id}/reply", response_model=ReviewOut)
def reply_to_review(
    review_id: int,
    payload: ReviewReplyCreate,
    landlord_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found.")

    if review.reply:
        raise HTTPException(409, "You have already replied to this review.")

    reply = ReviewReply(
        review_id=review_id,
        landlord_id=landlord_id,
        reply=payload.reply
    )
    db.add(reply)
    db.commit()
    db.refresh(review)
    return review


# --- Student edits their own review ---
@router.patch("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    payload: ReviewCreate,
    student_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter_by(id=review_id, student_id=student_id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    review.rating  = payload.rating
    review.comment = payload.comment
    db.commit()
    db.refresh(review)
    return review


# --- Admin hides a review ---
@router.patch("/{review_id}/visibility")
def toggle_visibility(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found.")
    review.is_visible = not review.is_visible
    db.commit()
    return {"id": review_id, "is_visible": review.is_visible}


# --- Student deletes their own review ---
@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    student_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter_by(id=review_id, student_id=student_id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    # Clean up R2 storage media files
    for media in review.media:
        try:
            delete_file(media.file_key)
        except Exception:
            pass # Keep deleting others even if one fails

    db.delete(review)
    db.commit()


# --- Upload media to a review ---
@router.post("/{review_id}/media", response_model=List[ReviewMediaOut], status_code=201)
async def upload_review_media(
    review_id: int,
    files: List[UploadFile] = File(...),
    student_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    # Verify review ownership
    review = db.query(Review).filter_by(id=review_id, student_id=student_id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    uploaded_records = []
    for file in files:
        # Validate mime type
        if file.content_type not in ALLOWED_MEDIA_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not supported. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime"
            )

        # Validate file size
        contents = await file.read()
        if len(contents) > MAX_MEDIA_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is too large. Max allowed size is {MAX_MEDIA_SIZE_MB}MB."
            )

        # File extension
        filename = file.filename or "file.jpg"
        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        
        # Save to R2
        key = f"reviews/{review_id}/{uuid4()}.{ext}"
        try:
            public_url = upload_file(io.BytesIO(contents), key, file.content_type)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload to storage: {str(e)}"
            )

        # Save to DB
        record = ReviewMedia(
            review_id=review_id,
            file_key=key,
            public_url=public_url,
            mime_type=file.content_type,
            size_bytes=len(contents)
        )
        db.add(record)
        uploaded_records.append(record)

    db.commit()
    for record in uploaded_records:
        db.refresh(record)

    return uploaded_records


# --- Delete a review media ---
@router.delete("/{review_id}/media/{media_id}", status_code=204)
def delete_review_media(
    review_id: int,
    media_id: int,
    student_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    # Verify review ownership
    review = db.query(Review).filter_by(id=review_id, student_id=student_id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    # Find media
    media = db.query(ReviewMedia).filter_by(id=media_id, review_id=review_id).first()
    if not media:
        raise HTTPException(404, "Media file not found for this review.")

    # Delete from R2
    try:
        delete_file(media.file_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete from storage: {str(e)}")

    db.delete(media)
    db.commit()
