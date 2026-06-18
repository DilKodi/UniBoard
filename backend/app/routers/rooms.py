from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, dependencies

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.post("", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    property_id: int,
    payload: schemas.RoomCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can manage rooms")

    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == property_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Boarding place not found")

    # Check ownership
    owner_profile = db.query(models.Owner).filter(models.Owner.user_id == current_user.id).first()
    if not owner_profile or listing.owner_id != owner_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this boarding place")

    room = models.Room(
        property_id=property_id,
        room_number=payload.room_number,
        room_type=payload.room_type,
        price=payload.price,
        floor_number=payload.floor_number,
        has_attached_bathroom=payload.has_attached_bathroom,
        has_balcony=payload.has_balcony,
        is_available=True,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/property/{property_id}", response_model=List[schemas.RoomResponse])
def get_property_rooms(property_id: int, db: Session = Depends(database.get_db)):
    rooms = db.query(models.Room).filter(models.Room.property_id == property_id).all()
    if not rooms:
        listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == property_id).first()
        if listing and listing.number_of_rooms > 0:
            rooms = []
            num_floors = listing.number_of_floors if listing.number_of_floors > 0 else 1
            for rNum in range(1, listing.number_of_rooms + 1):
                floor = ((rNum - 1) % num_floors) + 1
                room_idx = ((rNum - 1) // num_floors) + 1
                room_number = f"{floor}{room_idx:02d}"
                room = models.Room(
                    property_id=property_id,
                    room_number=room_number,
                    room_type="Single",
                    price=12000.0,
                    floor_number=floor,
                    is_available=True
                )
                db.add(room)
                rooms.append(room)
            db.commit()
            for r in rooms:
                db.refresh(r)
    return rooms

@router.put("/{room_id}", response_model=schemas.RoomResponse)
def update_room(
    room_id: int,
    payload: schemas.RoomUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can manage rooms")

    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == room.property_id).first()
    owner_profile = db.query(models.Owner).filter(models.Owner.user_id == current_user.id).first()
    if not owner_profile or not listing or listing.owner_id != owner_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this boarding place")

    if payload.room_number is not None:
        room.room_number = payload.room_number
    if payload.room_type is not None:
        room.room_type = payload.room_type
    if payload.price is not None:
        room.price = payload.price
    if payload.is_available is not None:
        room.is_available = payload.is_available

    db.commit()
    db.refresh(room)
    return room

@router.patch("/{room_id}/availability", response_model=schemas.RoomResponse)
def toggle_room_availability(
    room_id: int,
    is_available: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can manage rooms")

    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == room.property_id).first()
    owner_profile = db.query(models.Owner).filter(models.Owner.user_id == current_user.id).first()
    if not owner_profile or not listing or listing.owner_id != owner_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this boarding place")

    room.is_available = is_available
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_active_user),
):
    if current_user.role != models.UserRole.OWNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners can manage rooms")

    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    listing = db.query(models.BoardingPlace).filter(models.BoardingPlace.id == room.property_id).first()
    owner_profile = db.query(models.Owner).filter(models.Owner.user_id == current_user.id).first()
    if not owner_profile or not listing or listing.owner_id != owner_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this boarding place")

    db.delete(room)
    db.commit()
    return None
