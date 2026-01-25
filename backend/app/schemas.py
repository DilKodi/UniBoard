from pydantic import BaseModel, EmailStr
from typing import Optional
from .models import UserRole

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

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None