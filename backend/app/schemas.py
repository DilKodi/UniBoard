from pydantic import BaseModel, EmailStr
from typing import Optional, List
from .models import UserRole
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role: UserRole
    full_name: str
    # Optional fields depending on role
    university: Optional[str] = None
    nic_number: Optional[str] = None
    contact_number: Optional[str] = None

# Properties to return to client
class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True

# JWT Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[UserRole] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class BoardingPlaceCreate(BaseModel):
    property_name: str
    location: str
    address: str
    nearest_university: str
    number_of_floors: int
    number_of_rooms: int
    verification_document_name: Optional[str] = None
    gender_restriction: Optional[str] = "Any"


class RoomBase(BaseModel):
    room_number: str
    room_type: str
    price: float
    floor_number: Optional[int] = 1
    has_attached_bathroom: bool = False
    has_balcony: bool = False

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None

class RoomResponse(RoomBase):
    id: int
    property_id: int
    is_available: bool

    class Config:
        from_attributes = True


class BoardingPlaceResponse(BaseModel):
    id: int
    owner_id: int
    owner_full_name: Optional[str] = None
    property_name: str
    location: str
    address: str
    nearest_university: str
    number_of_floors: int
    number_of_rooms: int
    verification_document_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    gender_restriction: Optional[str] = None
    status: str
    created_at: datetime
    rooms: Optional[List[RoomResponse]] = []

    class Config:
        from_attributes = True


class RejectListingRequest(BaseModel):
    rejection_reason: Optional[str] = None