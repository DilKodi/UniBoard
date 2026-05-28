from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from .. import models, schemas, database

router = APIRouter(prefix="/boardings", tags=["Boarding Properties"])

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
        total_rooms=property_data.total_rooms,
        latitude=property_data.latitude,
        longitude=property_data.longitude,
        verification_document_url=property_data.verification_document_url,
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
    
    # Increment views
    property.views_count += 1
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
