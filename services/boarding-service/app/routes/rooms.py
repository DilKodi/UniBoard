from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.post("", response_model=schemas.RoomResponse, status_code=201)
def create_room(
    room_data: schemas.RoomCreate,
    property_id: int,
    db: Session = Depends(database.get_db)
):
    """Add a room to a property"""
    # Verify property exists
    property = db.query(models.BoardingProperty).filter(
        models.BoardingProperty.id == property_id
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Create room
    db_room = models.Room(
        property_id=property_id,
        room_number=room_data.room_number,
        room_type=room_data.room_type,
        price=room_data.price,
        floor_number=room_data.floor_number,
        has_attached_bathroom=room_data.has_attached_bathroom,
        has_balcony=room_data.has_balcony,
    )
    
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.get("/property/{property_id}", response_model=List[schemas.RoomResponse])
def get_property_rooms(
    property_id: int,
    available_only: bool = False,
    db: Session = Depends(database.get_db)
):
    """Get all rooms for a specific property"""
    query = db.query(models.Room).filter(models.Room.property_id == property_id)
    
    if available_only:
        query = query.filter(models.Room.is_available == True)
    
    rooms = query.all()
    return rooms

@router.get("/{room_id}", response_model=schemas.RoomResponse)
def get_room(room_id: int, db: Session = Depends(database.get_db)):
    """Get details of a specific room"""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return room

@router.put("/{room_id}", response_model=schemas.RoomResponse)
def update_room(
    room_id: int,
    room_data: schemas.RoomUpdate,
    db: Session = Depends(database.get_db)
):
    """Update room details"""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update fields
    for field, value in room_data.dict(exclude_unset=True).items():
        setattr(room, field, value)
    
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(database.get_db)):
    """Delete a room"""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(room)
    db.commit()
    return None

@router.patch("/{room_id}/availability", response_model=schemas.RoomResponse)
def toggle_room_availability(
    room_id: int,
    is_available: bool,
    db: Session = Depends(database.get_db)
):
    """Toggle room availability status"""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.is_available = is_available
    if is_available:
        room.status = models.RoomStatus.AVAILABLE
    else:
        room.status = models.RoomStatus.OCCUPIED
    
    db.commit()
    db.refresh(room)
    return room

@router.get("/available", response_model=List[schemas.RoomResponse])
def get_available_rooms(
    min_price: float = None,
    max_price: float = None,
    room_type: models.RoomType = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db)
):
    """Get all available rooms across all properties with filters"""
    query = db.query(models.Room).filter(models.Room.is_available == True)
    
    if min_price:
        query = query.filter(models.Room.price >= min_price)
    
    if max_price:
        query = query.filter(models.Room.price <= max_price)
    
    if room_type:
        query = query.filter(models.Room.room_type == room_type)
    
    rooms = query.offset(skip).limit(limit).all()
    return rooms
