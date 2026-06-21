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
    number_of_rooms: Optional[int] = None
    total_rooms: Optional[int] = None
    verification_document_name: Optional[str] = None
    gender_restriction: Optional[str] = "Any"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rooms: Optional[List[RoomResponse]] = []

    class Config:
        from_attributes = True


class RejectListingRequest(BaseModel):
    rejection_reason: Optional[str] = None

class ReviewCreate(BaseModel):
    property_id : int
    booking_id  : Optional[int] = None
    visit_id    : Optional[int] = None
    rating      : int
    comment     : Optional[str] = None

class ReviewReplyCreate(BaseModel):
    reply: str

class ReviewReplyOut(BaseModel):
    id          : int
    landlord_id : int
    reply       : str
    created_at  : datetime

    class Config:
        from_attributes = True

class ReviewMediaOut(BaseModel):
    id          : int
    public_url  : str
    file_key    : str
    mime_type   : str
    size_bytes  : int
    created_at  : datetime

    class Config:
        from_attributes = True

class ReviewOut(BaseModel):
    id          : int
    property_id : int
    student_id  : int
    reviewer_role: str = "student"
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    booking_id  : Optional[int] = None
    visit_id    : Optional[int] = None
    rating      : int
    comment     : Optional[str] = None
    is_visible  : bool
    created_at  : datetime
    reply       : Optional[ReviewReplyOut] = None
    media       : List[ReviewMediaOut] = []

    class Config:
        from_attributes = True

class PropertyRatingSummary(BaseModel):
    property_id   : int
    average_rating: float
    total_reviews : int