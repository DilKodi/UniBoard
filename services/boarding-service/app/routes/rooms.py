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
        max_sharing=room_data.max_sharing,
        slots_taken=room_data.slots_taken,
    )
    
    # Auto-adjust is_available and status
    if db_room.room_type == models.RoomType.SHARED:
        if db_room.max_sharing is not None and db_room.slots_taken is not None:
            if db_room.slots_taken >= db_room.max_sharing:
                db_room.is_available = False
                db_room.status = models.RoomStatus.OCCUPIED
            else:
                db_room.is_available = True
                db_room.status = models.RoomStatus.AVAILABLE
    else:
        db_room.max_sharing = 1
        if db_room.slots_taken is not None:
            if db_room.slots_taken >= 1:
                db_room.is_available = False
                db_room.status = models.RoomStatus.OCCUPIED
            else:
                db_room.is_available = True
                db_room.status = models.RoomStatus.AVAILABLE
    
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
    rooms = db.query(models.Room).filter(models.Room.property_id == property_id).all()
    
    if not rooms:
        # Check if the property exists
        property = db.query(models.BoardingProperty).filter(
            models.BoardingProperty.id == property_id
        ).first()
        if property and property.total_rooms > 0:
            rooms = []
            num_floors = property.number_of_floors if property.number_of_floors > 0 else 1
            for rNum in range(1, property.total_rooms + 1):
                floor = ((rNum - 1) % num_floors) + 1
                room_idx = ((rNum - 1) // num_floors) + 1
                room_number = f"{floor}{room_idx:02d}"
                room = models.Room(
                    property_id=property_id,
                    room_number=room_number,
                    room_type=models.RoomType.SINGLE,
                    price=12000.0,
                    floor_number=floor,
                    is_available=True
                )
                db.add(room)
                rooms.append(room)
            db.commit()
            for r in rooms:
                db.refresh(r)
                
    if available_only:
        rooms = [r for r in rooms if r.is_available]
        
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
        
    # Auto-adjust is_available and status if sharing details are updated
    if room.room_type == models.RoomType.SHARED:
        if room.max_sharing is not None and room.slots_taken is not None:
            if room.slots_taken >= room.max_sharing:
                room.is_available = False
                room.status = models.RoomStatus.OCCUPIED
            else:
                room.is_available = True
                room.status = models.RoomStatus.AVAILABLE
    else:
        room.max_sharing = 1
        if room.slots_taken is not None:
            if room.slots_taken >= 1:
                room.is_available = False
                room.status = models.RoomStatus.OCCUPIED
            else:
                room.is_available = True
                room.status = models.RoomStatus.AVAILABLE
    
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
