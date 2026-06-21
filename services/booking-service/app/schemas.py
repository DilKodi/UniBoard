from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VisitRequestCreate(BaseModel):
    student_id: int
    student_name: str
    property_id: int
    property_name: str
    room_name: Optional[str] = None
    requested_date: str

class VisitRequestResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    property_id: int
    property_name: str
    room_name: Optional[str] = None
    requested_date: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BookingRequestCreate(BaseModel):
    student_id: int
    student_name: str
    property_id: int
    property_name: str
    room_id: str
    room_name: str
    requested_date: str

class BookingRequestResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    property_id: int
    property_name: str
    room_id: str
    room_name: str
    requested_date: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RequestStatusUpdate(BaseModel):
    status: str  # accepted or declined
