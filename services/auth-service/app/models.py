from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Enum
from sqlalchemy.orm import relationship
from .database import Base
import enum

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
    is_verified = Column(Boolean, default=False)

    student_profile = relationship("Student", back_populates="user", uselist=False)
    owner_profile = relationship("Owner", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String)
    university = Column(String)
    phone_number = Column(String, nullable=True)
    student_id = Column(String, nullable=True)
    address = Column(String, nullable=True)
    year_of_study = Column(String, nullable=True)
    major = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)

    user = relationship("User", back_populates="student_profile")

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String)
    nic_number = Column(String)
    contact_number = Column(String)
    office_address = Column(String, nullable=True)
    preferred_contact_time = Column(String, nullable=True)
    property_business_name = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)

    user = relationship("User", back_populates="owner_profile")
