from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class VisitRequest(Base):
    __tablename__ = "visit_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    student_name = Column(String, nullable=False)
    property_id = Column(Integer, nullable=False, index=True)
    property_name = Column(String, nullable=False)
    room_name = Column(String, nullable=True)
    requested_date = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)

class BookingRequest(Base):
    __tablename__ = "booking_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    student_name = Column(String, nullable=False)
    property_id = Column(Integer, nullable=False, index=True)
    property_name = Column(String, nullable=False)
    room_id = Column(String, nullable=False)
    room_name = Column(String, nullable=False)
    requested_date = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)
