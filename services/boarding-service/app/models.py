from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text, DateTime, Enum as SQLEnum, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class RoomType(str, enum.Enum):
    SINGLE = "Single"
    SHARED = "Shared"
    STUDIO = "Studio"
    DOUBLE = "Double"

class PropertyStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class RoomStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    MAINTENANCE = "Maintenance"

class BoardingProperty(Base):
    __tablename__ = "boarding_properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, nullable=False, index=True)  # From auth service
    property_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    nearest_university = Column(String, nullable=False)
    distance_from_university = Column(Float)  # in km
    number_of_floors = Column(Integer, nullable=False)
    total_rooms = Column(Integer, nullable=False)
    
    # Geolocation
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Status and verification
    status = Column(SQLEnum(PropertyStatus), default=PropertyStatus.PENDING)
    is_verified = Column(Boolean, default=False)
    verification_document_url = Column(String)
    
    # Extra Details (SRS / UI Integration)
    description = Column(Text, nullable=True)
    images = Column(String, nullable=True)  # comma separated list of image paths/URLs
    gender_restriction = Column(String, default="Any")
    price_range = Column(String, nullable=True)
    
    # Ratings and stats
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    amenities = relationship("PropertyAmenity", back_populates="property", cascade="all, delete-orphan")
    images_list = relationship("BoardingImage", back_populates="property", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("boarding_properties.id"), nullable=False)
    room_number = Column(String, nullable=False)
    room_type = Column(SQLEnum(RoomType), nullable=False)
    price = Column(Float, nullable=False)
    status = Column(SQLEnum(RoomStatus), default=RoomStatus.AVAILABLE)
    
    # Room details
    floor_number = Column(Integer)
    has_attached_bathroom = Column(Boolean, default=False)
    has_balcony = Column(Boolean, default=False)
    max_sharing = Column(Integer, default=1)
    slots_taken = Column(Integer, default=0)
    
    # Availability
    is_available = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    property = relationship("BoardingProperty", back_populates="rooms")

class PropertyAmenity(Base):
    __tablename__ = "property_amenities"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("boarding_properties.id"), nullable=False)
    amenity_name = Column(String, nullable=False)  # WiFi, Gym, Parking, AC, Laundry, etc.
    
    # Relationships
    property = relationship("BoardingProperty", back_populates="amenities")

class BoardingImage(Base):
    __tablename__ = "boarding_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("boarding_properties.id", ondelete="CASCADE"), nullable=False)
    file_key = Column(Text, nullable=False)
    public_url = Column(Text, nullable=False)
    mime_type = Column(String)
    size_bytes = Column(BigInteger)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    property = relationship("BoardingProperty", back_populates="images_list")
