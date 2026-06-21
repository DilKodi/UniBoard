from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .models import RoomType, PropertyStatus, RoomStatus

# Room Schemas
class RoomBase(BaseModel):
    room_number: str
    room_type: RoomType
    price: float
    floor_number: Optional[int] = None
    has_attached_bathroom: bool = False
    has_balcony: bool = False
    max_sharing: Optional[int] = 1
    slots_taken: Optional[int] = 0

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[RoomType] = None
    price: Optional[float] = None
    status: Optional[RoomStatus] = None
    is_available: Optional[bool] = None
    floor_number: Optional[int] = None
    has_attached_bathroom: Optional[bool] = None
    has_balcony: Optional[bool] = None
    max_sharing: Optional[int] = None
    slots_taken: Optional[int] = None

class RoomResponse(RoomBase):
    id: int
    property_id: int
    status: Optional[RoomStatus] = None
    is_available: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Amenity Schemas
class AmenityBase(BaseModel):
    amenity_name: str

class AmenityCreate(AmenityBase):
    pass

class AmenityResponse(AmenityBase):
    id: int
    property_id: int

    class Config:
        from_attributes = True

# Property Schemas
class PropertyBase(BaseModel):
    property_name: str
    location: str
    address: str
    nearest_university: str
    distance_from_university: Optional[float] = None
    number_of_floors: int
    total_rooms: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    images: Optional[str] = None
    gender_restriction: Optional[str] = "Any"
    price_range: Optional[str] = None

class PropertyCreate(PropertyBase):
    owner_id: int
    verification_document_url: Optional[str] = None
    number_of_rooms: Optional[int] = None
    amenities: List[str] = []

class PropertyUpdate(BaseModel):
    property_name: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    nearest_university: Optional[str] = None
    distance_from_university: Optional[float] = None
    number_of_floors: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    images: Optional[str] = None
    gender_restriction: Optional[str] = None
    price_range: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: int
    owner_id: int
    status: Optional[PropertyStatus] = None
    is_verified: Optional[bool] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    views_count: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    rooms: List[RoomResponse] = Field(default_factory=list)
    amenities: List[AmenityResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class PropertyListResponse(PropertyBase):
    id: int
    owner_id: int
    status: Optional[PropertyStatus] = None
    is_verified: Optional[bool] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    views_count: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    rooms: List[RoomResponse] = Field(default_factory=list)
    amenities: List[AmenityResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

# Search and Filter Schemas
class PropertySearchParams(BaseModel):
    university: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    room_type: Optional[RoomType] = None
    verified_only: bool = False
    max_distance: Optional[float] = None  # in km
    amenities: Optional[List[str]] = None
    skip: int = 0
    limit: int = 20


class RejectListingRequest(BaseModel):
    rejection_reason: Optional[str] = None
