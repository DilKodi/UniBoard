from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, dependencies

router = APIRouter(prefix="/admin/listings", tags=["Admin Listings"])


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
    )


@router.get("/pending", response_model=List[schemas.BoardingPlaceResponse])
def get_pending_listings(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.require_admin),
):
    listings = (
        db.query(models.BoardingPlace)
        .filter(models.BoardingPlace.status == models.ListingStatus.PENDING)
        .order_by(models.BoardingPlace.created_at.desc())
        .all()
    )
    owner_ids = [listing.owner_id for listing in listings]
    owner_profiles = db.query(models.Owner).filter(models.Owner.id.in_(owner_ids)).all() if owner_ids else []
    owner_by_id = {owner.id: owner for owner in owner_profiles}
    return [_build_listing_response(listing, owner_by_id.get(listing.owner_id)) for listing in listings]


@router.post("/{listing_id}/approve", response_model=schemas.BoardingPlaceResponse)
def approve_listing(
    listing_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.require_admin),
):
    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    listing.status = models.ListingStatus.APPROVED
    db.commit()
    db.refresh(listing)

    owner_profile = db.query(models.Owner).filter(models.Owner.id == listing.owner_id).first()
    return _build_listing_response(listing, owner_profile)


@router.post("/{listing_id}/reject", response_model=schemas.BoardingPlaceResponse)
def reject_listing(
    listing_id: int,
    payload: schemas.RejectListingRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.require_admin),
):
    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    listing.status = models.ListingStatus.REJECTED
    listing.rejection_reason = payload.rejection_reason.strip() if payload.rejection_reason else None
    db.commit()
    db.refresh(listing)

    owner_profile = db.query(models.Owner).filter(models.Owner.id == listing.owner_id).first()
    return _build_listing_response(listing, owner_profile)


@router.post("/{listing_id}/reset", response_model=schemas.BoardingPlaceResponse)
def reset_listing(
    listing_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.require_admin),
):
    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    listing.status = models.ListingStatus.PENDING
    listing.rejection_reason = None
    db.commit()
    db.refresh(listing)

    owner_profile = db.query(models.Owner).filter(models.Owner.id == listing.owner_id).first()
    return _build_listing_response(listing, owner_profile)
