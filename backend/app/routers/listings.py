from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, dependencies
import os
import shutil
from datetime import datetime

router = APIRouter(prefix="/listings", tags=["Listings"])



@router.post("/upload")
def upload_verification_document(file: UploadFile = File(...)):
    # save uploaded file to backend/app/uploads with a timestamp prefix
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
    os.makedirs(uploads_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_name = f"{timestamp}_{file.filename}"
    dest_path = os.path.join(uploads_dir, safe_name)
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    return {"filename": safe_name}


def _build_listing_response(listing: models.BoardingPlace, owner_profile: models.Owner | None = None):
    return schemas.BoardingPlaceResponse(
        id=listing.id,
        owner_id=listing.owner_id,
        owner_full_name=owner_profile.full_name if owner_profile else None,
        property_name=listing.property_name,
        location=listing.location,
        address=listing.address,
        nearest_university=listing.nearest_university,
        number_of_floors=listing.number_of_floors,
        number_of_rooms=listing.number_of_rooms,
        verification_document_name=listing.verification_document_name,
        rejection_reason=listing.rejection_reason,
        gender_restriction=listing.gender_restriction,
        status=listing.status.value if listing.status else models.ListingStatus.PENDING.value,
        created_at=listing.created_at,
        latitude=listing.latitude,
        longitude=listing.longitude,
        rooms=[
            schemas.RoomResponse(
                id=r.id,
                property_id=r.property_id,
                room_number=r.room_number,
                room_type=r.room_type,
                price=r.price,
                floor_number=r.floor_number,
                has_attached_bathroom=r.has_attached_bathroom,
                has_balcony=r.has_balcony,
                is_available=r.is_available,
            ) for r in listing.rooms
        ] if listing.rooms else [],
    )


@router.post("", response_model=schemas.BoardingPlaceResponse, status_code=status.HTTP_201_CREATED)
def create_boarding_place(
    payload: schemas.BoardingPlaceCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can create listings")

    owner_profile = db.query(models.Owner).filter(models.Owner.user_id == current_user.id).first()
    if owner_profile is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner profile not found")

    num_rooms = payload.number_of_rooms if payload.number_of_rooms is not None else payload.total_rooms
    if num_rooms is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Number of rooms must be provided",
        )

    if payload.number_of_floors < 1 or num_rooms < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Number of floors and rooms must be greater than zero",
        )

    # Resolve latitude/longitude coordinates
    from ..utils import geocode_address, get_university_fallback_coords
    lat = payload.latitude
    lon = payload.longitude

    if lat is None or lon is None:
        # Try server-side geocoding as fallback
        lat, lon = geocode_address(payload.address)
        if lat is None or lon is None:
            # Final fallback to university coords
            lat, lon = get_university_fallback_coords(payload.nearest_university)

    listing = models.BoardingPlace(
        owner_id=owner_profile.id,
        property_name=payload.property_name,
        location=payload.location,
        address=payload.address,
        nearest_university=payload.nearest_university,
        number_of_floors=payload.number_of_floors,
        number_of_rooms=num_rooms,
        verification_document_name=payload.verification_document_name,
        gender_restriction=payload.gender_restriction,
        latitude=lat,
        longitude=lon,
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return _build_listing_response(listing, owner_profile)


@router.get("", response_model=List[schemas.BoardingPlaceResponse])
def get_boarding_places(db: Session = Depends(database.get_db)):
    listings = (
        db.query(models.BoardingPlace)
        .filter(models.BoardingPlace.status == models.ListingStatus.APPROVED)
        .order_by(models.BoardingPlace.created_at.desc())
        .all()
    )
    owner_ids = [listing.owner_id for listing in listings]
    owner_profiles = db.query(models.Owner).filter(models.Owner.id.in_(owner_ids)).all() if owner_ids else []
    owner_by_id = {owner.id: owner for owner in owner_profiles}
    return [_build_listing_response(listing, owner_by_id.get(listing.owner_id)) for listing in listings]


@router.get("/mine", response_model=List[schemas.BoardingPlaceResponse])
def get_my_boarding_places(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can view owner listings")

    owner_profile = db.query(models.Owner).filter(models.Owner.user_id == current_user.id).first()
    if owner_profile is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner profile not found")

    listings = (
        db.query(models.BoardingPlace)
        .filter(models.BoardingPlace.owner_id == owner_profile.id)
        .order_by(models.BoardingPlace.created_at.desc())
        .all()
    )
    return [_build_listing_response(listing, owner_profile) for listing in listings]


@router.get("/{listing_id}", response_model=schemas.BoardingPlaceResponse)
def get_boarding_place(listing_id: int, db: Session = Depends(database.get_db)):
    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    owner_profile = db.query(models.Owner).filter(models.Owner.id == listing.owner_id).first()
    return _build_listing_response(listing, owner_profile)
