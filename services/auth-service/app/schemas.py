from pydantic import BaseModel, EmailStr
from typing import Optional
from .models import UserRole

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: UserRole
    full_name: str
    university: Optional[str] = None
    nic_number: Optional[str] = None
    contact_number: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


class OwnerProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    contact_number: Optional[str] = None
    nic_number: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[UserRole] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
