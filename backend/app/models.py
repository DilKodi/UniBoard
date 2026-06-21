from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Enum, DateTime, Float
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    STUDENT = "student"
    OWNER = "owner"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    # Verification status for KYC (SRS Req-2, Req-4)
    is_verified = Column(Boolean, default=False) 

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    owner_profile = relationship("Owner", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String)
    university = Column(String)
    
    user = relationship("User", back_populates="student_profile")

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String)
    nic_number = Column(String) # For identity verification
    contact_number = Column(String)
    
    user = relationship("User", back_populates="owner_profile")
    boarding_places = relationship("BoardingPlace", back_populates="owner")


class ListingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class BoardingPlace(Base):
    __tablename__ = "boarding_places"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    property_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    address = Column(String, nullable=False)
    nearest_university = Column(String, nullable=False)
    number_of_floors = Column(Integer, nullable=False)
    number_of_rooms = Column(Integer, nullable=False)
    verification_document_name = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    gender_restriction = Column(String, nullable=True, default="Any")
    status = Column(Enum(ListingStatus), default=ListingStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    owner = relationship("Owner", back_populates="boarding_places")
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("boarding_places.id"), nullable=False)
    room_number = Column(String, nullable=False)
    room_type = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    floor_number = Column(Integer, default=1)
    has_attached_bathroom = Column(Boolean, default=False)
    has_balcony = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)

    property = relationship("BoardingPlace", back_populates="rooms")

class Review(Base):
    __tablename__ = "reviews"

    id          = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("boarding_places.id"), nullable=False, index=True)
    student_id  = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reviewer_role = Column(String, nullable=False, default="student")
    reviewer_name = Column(String, nullable=True)
    reviewer_email = Column(String, nullable=True)
    booking_id  = Column(Integer, unique=True, nullable=True)
    visit_id    = Column(Integer, unique=True, nullable=True)
    rating      = Column(Integer, nullable=False)
    comment     = Column(String, nullable=True)
    is_visible  = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, onupdate=datetime.utcnow)

    reply = relationship("ReviewReply", back_populates="review", uselist=False, cascade="all, delete-orphan")
    media = relationship("ReviewMedia", back_populates="review", cascade="all, delete-orphan")

class ReviewReply(Base):
    __tablename__ = "review_replies"

    id          = Column(Integer, primary_key=True, index=True)
    review_id   = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, unique=True)
    landlord_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reply       = Column(String, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    review = relationship("Review", back_populates="reply")

class ReviewMedia(Base):
    __tablename__ = "review_media"

    id          = Column(Integer, primary_key=True, index=True)
    review_id   = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    file_key    = Column(String, nullable=False)
    public_url  = Column(String, nullable=False)
    mime_type   = Column(String, nullable=False)
    size_bytes  = Column(Integer, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    review = relationship("Review", back_populates="media")