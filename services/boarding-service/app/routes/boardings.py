from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from .. import models, schemas, database

router = APIRouter(prefix="/boardings", tags=["Boarding Properties"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def _save_upload(file: UploadFile) -> tuple[str, str]:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    original_name = Path(file.filename or "document").name
    safe_name = f"{uuid4().hex}_{original_name}"
    target_path = UPLOAD_DIR / safe_name

    with target_path.open("wb") as target_file:
        while chunk := file.file.read(1024 * 1024):
            target_file.write(chunk)

    return safe_name, f"/uploads/{safe_name}"


def _serialize_property(property: models.BoardingProperty) -> dict:
        verification_document_name = None
        if property.verification_document_url:
            verification_document_name = Path(property.verification_document_url).name

        return {
                "id": property.id,
                "owner_id": property.owner_id,
                "owner_full_name": None,
                "property_name": property.property_name,
                "location": property.location,
                "address": property.address,
                "nearest_university": property.nearest_university,
                "number_of_floors": property.number_of_floors,
                "number_of_rooms": property.total_rooms,
                "verification_document_name": verification_document_name,
                "rejection_reason": None,
                "status": property.status.value if property.status else models.PropertyStatus.PENDING.value,
                "created_at": property.created_at,
        }


@router.post("/upload")
async def upload_verification_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")

    safe_name, file_url = _save_upload(file)
    return {
        "filename": safe_name,
        "original_filename": file.filename,
        "file_url": file_url,
    }


@router.get("/admin/listings/pending")
def get_pending_listings(db: Session = Depends(database.get_db)):
    listings = (
        db.query(models.BoardingProperty)
        .order_by(models.BoardingProperty.created_at.desc())
        .all()
    )
    return [_serialize_property(listing) for listing in listings]



@router.post("/admin/listings/{listing_id}/approve")
def approve_listing(listing_id: int, db: Session = Depends(database.get_db)):
    listing = db.query(models.BoardingProperty).filter(models.BoardingProperty.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.status = models.PropertyStatus.VERIFIED
    listing.is_verified = True
    db.commit()
    db.refresh(listing)
    return _serialize_property(listing)


@router.post("/admin/listings/{listing_id}/reject")
def reject_listing(listing_id: int, payload: schemas.RejectListingRequest, db: Session = Depends(database.get_db)):
    listing = db.query(models.BoardingProperty).filter(models.BoardingProperty.id == listing_id).first()
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.status = models.PropertyStatus.REJECTED
    listing.is_verified = False
    db.commit()
    db.refresh(listing)
    return _serialize_property(listing)

@router.post("", response_model=schemas.PropertyResponse, status_code=201)
def create_property(
    property_data: schemas.PropertyCreate,
    db: Session = Depends(database.get_db)
):
    """Create a new boarding property listing"""
    # Create property
    db_property = models.BoardingProperty(
        owner_id=property_data.owner_id,
        property_name=property_data.property_name,
        location=property_data.location,
        address=property_data.address,
        nearest_university=property_data.nearest_university,
        distance_from_university=property_data.distance_from_university,
        number_of_floors=property_data.number_of_floors,
        total_rooms=property_data.total_rooms or property_data.number_of_rooms or 0,
        latitude=property_data.latitude,
        longitude=property_data.longitude,
        verification_document_url=property_data.verification_document_url,
        status=models.PropertyStatus.PENDING,
        is_verified=False,
    )
    
    db.add(db_property)
    db.flush()  # Get the property ID
    
    # Add amenities
    for amenity_name in property_data.amenities:
        amenity = models.PropertyAmenity(
            property_id=db_property.id,
            amenity_name=amenity_name
        )
        db.add(amenity)
    
    db.commit()
    db.refresh(db_property)
    return db_property

@router.get("", response_model=List[schemas.PropertyListResponse])
def list_properties(
    university: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    room_type: Optional[models.RoomType] = None,
    verified_only: bool = False,
    max_distance: Optional[float] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(database.get_db)
):
    """List all boarding properties with optional filters"""
    query = db.query(models.BoardingProperty)
    
    # Apply filters
    if university:
        query = query.filter(models.BoardingProperty.nearest_university.ilike(f"%{university}%"))
    
    if verified_only:
        query = query.filter(models.BoardingProperty.is_verified == True)
    
    if max_distance:
        query = query.filter(models.BoardingProperty.distance_from_university <= max_distance)
    
    # Filter by room price range if specified
    if min_price or max_price or room_type:
        query = query.join(models.Room)
        if min_price:
            query = query.filter(models.Room.price >= min_price)
        if max_price:
            query = query.filter(models.Room.price <= max_price)
        if room_type:
            query = query.filter(models.Room.room_type == room_type)
        query = query.distinct()
    
    properties = query.offset(skip).limit(limit).all()
    return properties

@router.get("/{property_id}", response_model=schemas.PropertyResponse)
def get_property(property_id: int, db: Session = Depends(database.get_db)):
    """Get detailed information about a specific property"""
    property = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.id == property_id
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Increment views (handle None for legacy records)
    property.views_count = (property.views_count or 0) + 1
    db.commit()
    
    return property

@router.put("/{property_id}", response_model=schemas.PropertyResponse)
def update_property(
    property_id: int,
    property_data: schemas.PropertyUpdate,
    db: Session = Depends(database.get_db)
):
    """Update property details"""
    property = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.id == property_id
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Update fields
    for field, value in property_data.dict(exclude_unset=True).items():
        setattr(property, field, value)
    
    db.commit()
    db.refresh(property)
    return property

@router.delete("/{property_id}", status_code=204)
def delete_property(property_id: int, db: Session = Depends(database.get_db)):
    """Delete a property"""
    property = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.id == property_id
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(property)
    db.commit()
    return None

@router.get("/owner/{owner_id}", response_model=List[schemas.PropertyResponse])
def get_owner_properties(
    owner_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(database.get_db)
):
    """Get all properties owned by a specific owner"""
    properties = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.owner_id == owner_id
    ).offset(skip).limit(limit).all()
    
    return properties

@router.patch("/{property_id}/verify", response_model=schemas.PropertyResponse)
def verify_property(property_id: int, db: Session = Depends(database.get_db)):
    """Verify a property (admin only)"""
    property = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.id == property_id
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    property.is_verified = True
    property.status = models.PropertyStatus.VERIFIED
    db.commit()
    db.refresh(property)
    return property

@router.post("/{property_id}/amenities", response_model=schemas.AmenityResponse)
def add_amenity(
    property_id: int,
    amenity: schemas.AmenityCreate,
    db: Session = Depends(database.get_db)
):
    """Add an amenity to a property"""
    property = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.id == property_id
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db_amenity = models.PropertyAmenity(
        property_id=property_id,
        amenity_name=amenity.amenity_name
    )
    db.add(db_amenity)
    db.commit()
    db.refresh(db_amenity)
    return db_amenity

@router.delete("/{property_id}/amenities/{amenity_id}", status_code=204)
def remove_amenity(
    property_id: int,
    amenity_id: int,
    db: Session = Depends(database.get_db)
):
    """Remove an amenity from a property"""
    amenity = db.query(models.PropertyAmenity).filter(
        and_(
            models.PropertyAmenity.id == amenity_id,
            models.PropertyAmenity.property_id == property_id
        )
    ).first()
    
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    db.delete(amenity)
    db.commit()
    return None
