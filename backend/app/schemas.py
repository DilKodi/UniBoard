from pydantic import BaseModel, EmailStr
from typing import Optional
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
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RejectListingRequest(BaseModel):
    rejection_reason: Optional[str] = None