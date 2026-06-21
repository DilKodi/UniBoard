from fastapi import APIRouter, Depends, HTTPException, status, Header, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import shutil
from datetime import datetime

from ..database import get_db
from .. import models, schemas, dependencies

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# --- Submit a review ---
@router.post("/", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    payload: schemas.ReviewCreate,
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.STUDENT, models.UserRole.OWNER]:
        raise HTTPException(403, "Only registered students or boarding owners can write reviews.")

    # Check duplicate review
    if payload.booking_id is not None:
        existing = db.query(models.Review).filter_by(booking_id=payload.booking_id).first()
        if existing:
            raise HTTPException(409, "You have already reviewed this booking.")
    elif payload.visit_id is not None:
        existing = db.query(models.Review).filter_by(visit_id=payload.visit_id).first()
        if existing:
            raise HTTPException(409, "You have already reviewed this visit.")
    else:
        existing = db.query(models.Review).filter_by(property_id=payload.property_id, student_id=current_user.id).first()
        if existing:
            raise HTTPException(409, "You have already reviewed this property.")

    # Resolve reviewer name
    reviewer_name = current_user.email
    if current_user.role == models.UserRole.STUDENT and current_user.student_profile:
        reviewer_name = current_user.student_profile.full_name
    elif current_user.role == models.UserRole.OWNER and current_user.owner_profile:
        reviewer_name = current_user.owner_profile.full_name

    review = models.Review(
        property_id=payload.property_id,
        student_id=current_user.id,
        reviewer_role=current_user.role.value,
        reviewer_name=reviewer_name,
        reviewer_email=current_user.email,
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
@router.get("/property/{property_id}", response_model=List[schemas.ReviewOut])
def get_property_reviews(
    property_id: int,
    include_hidden: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(models.Review).filter(models.Review.property_id == property_id)
    if not include_hidden:
        query = query.filter(models.Review.is_visible == True)
    return query.order_by(models.Review.created_at.desc()).all()

# --- Get rating summary for a property ---
@router.get("/property/{property_id}/summary", response_model=schemas.PropertyRatingSummary)
def get_rating_summary(property_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.avg(models.Review.rating).label("average"),
            func.count(models.Review.id).label("total")
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
@router.post("/{review_id}/reply", response_model=schemas.ReviewOut)
def reply_to_review(
    review_id: int,
    payload: schemas.ReviewReplyCreate,
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(403, "Only landlords can reply to reviews.")

    review = db.query(models.Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found.")

    if review.reply:
        raise HTTPException(409, "You have already replied to this review.")

    reply = models.ReviewReply(
        review_id=review_id,
        landlord_id=current_user.id,
        reply=payload.reply
    )
    db.add(reply)
    db.commit()
    db.refresh(review)
    return review

# --- Student edits their own review ---
@router.patch("/{review_id}", response_model=schemas.ReviewOut)
def update_review(
    review_id: int,
    payload: schemas.ReviewCreate,
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter_by(id=review_id, student_id=current_user.id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    review.rating  = payload.rating
    review.comment = payload.comment
    db.commit()
    db.refresh(review)
    return review

# --- Admin hides a review ---
@router.patch("/{review_id}/visibility")
def toggle_visibility(
    review_id: int,
    current_user: models.User = Depends(dependencies.require_admin),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found.")
    review.is_visible = not review.is_visible
    db.commit()
    return {"id": review_id, "is_visible": review.is_visible}

# --- Student deletes their own review ---
@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter_by(id=review_id, student_id=current_user.id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    # Clean up local uploads
    for media in review.media:
        try:
            # key is filename
            uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
            os.remove(os.path.join(uploads_dir, media.file_key))
        except Exception:
            pass

    db.delete(review)
    db.commit()

# --- Upload media to a review ---
@router.post("/{review_id}/media", response_model=List[schemas.ReviewMediaOut], status_code=201)
def upload_review_media(
    review_id: int,
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter_by(id=review_id, student_id=current_user.id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    uploaded_records = []
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
    os.makedirs(uploads_dir, exist_ok=True)

    for file in files:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_name = f"{timestamp}_{file.filename}"
        dest_path = os.path.join(uploads_dir, safe_name)
        
        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()

        public_url = f"/uploads/{safe_name}"

        # Save to DB
        record = models.ReviewMedia(
            review_id=review_id,
            file_key=safe_name,
            public_url=public_url,
            mime_type=file.content_type or "image/jpeg",
            size_bytes=os.path.getsize(dest_path)
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
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter_by(id=review_id, student_id=current_user.id).first()
    if not review:
        raise HTTPException(404, "Review not found or not yours.")

    media = db.query(models.ReviewMedia).filter_by(id=media_id, review_id=review_id).first()
    if not media:
        raise HTTPException(404, "Media file not found for this review.")

    try:
        uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
        os.remove(os.path.join(uploads_dir, media.file_key))
    except Exception:
        pass

    db.delete(media)
    db.commit()
