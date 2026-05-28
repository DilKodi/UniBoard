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

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    price: Optional[float] = None
    status: Optional[RoomStatus] = None
    is_available: Optional[bool] = None

class RoomResponse(RoomBase):
    id: int
    property_id: int
    status: RoomStatus
    is_available: bool
    created_at: datetime
    updated_at: datetime

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

class PropertyCreate(PropertyBase):
    owner_id: int
    verification_document_url: Optional[str] = None
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

class PropertyResponse(PropertyBase):
    id: int
    owner_id: int
    status: PropertyStatus
    is_verified: bool
    rating: float
    total_reviews: int
    views_count: int
    created_at: datetime
    updated_at: datetime
    rooms: List[RoomResponse] = []
    amenities: List[AmenityResponse] = []

    class Config:
        from_attributes = True

class PropertyListResponse(BaseModel):
    id: int
    property_name: str
    location: str
    nearest_university: str
    distance_from_university: Optional[float]
    rating: float
    total_reviews: int
    is_verified: bool
    rooms: List[RoomResponse] = []
    amenities: List[AmenityResponse] = []

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
