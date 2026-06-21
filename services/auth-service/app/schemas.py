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

class StudentProfileSchema(BaseModel):
    full_name: str
    university: Optional[str] = None
    phone_number: Optional[str] = None
    student_id: Optional[str] = None
    address: Optional[str] = None
    year_of_study: Optional[str] = None
    major: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class OwnerProfileSchema(BaseModel):
    full_name: str
    nic_number: Optional[str] = None
    contact_number: Optional[str] = None
    office_address: Optional[str] = None
    preferred_contact_time: Optional[str] = None
    property_business_name: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    phone_number: Optional[str] = None
    student_id: Optional[str] = None
    address: Optional[str] = None
    year_of_study: Optional[str] = None
    major: Optional[str] = None
    profile_image_url: Optional[str] = None

class OwnerProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    contact_number: Optional[str] = None
    office_address: Optional[str] = None
    preferred_contact_time: Optional[str] = None
    property_business_name: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    student_profile: Optional[StudentProfileSchema] = None
    owner_profile: Optional[OwnerProfileSchema] = None

    class Config:
        from_attributes = True


class OwnerProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    contact_number: Optional[str] = None
    nic_number: Optional[str] = None
    office_address: Optional[str] = None
    preferred_contact_time: Optional[str] = None
    property_business_name: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[UserRole] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
