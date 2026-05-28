from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Enum, DateTime
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
    status = Column(Enum(ListingStatus), default=ListingStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("Owner", back_populates="boarding_places")