from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Optional, List

class ReviewCreate(BaseModel):
    property_id : int
    booking_id  : Optional[int] = None
    visit_id    : Optional[int] = None
    rating      : int = Field(..., ge=1, le=5)
    comment     : Optional[str] = None

    @model_validator(mode="after")
    def check_booking_or_visit(self):
        booking_id = self.booking_id
        visit_id = self.visit_id
        if booking_id is not None and visit_id is not None:
            raise ValueError("Cannot provide both booking_id and visit_id.")
        return self

class ReviewReplyCreate(BaseModel):
    reply: str = Field(..., min_length=1, max_length=1000)

class ReviewReplyOut(BaseModel):
    id          : int
    landlord_id : int
    reply       : str
    created_at  : datetime

    class Config:
        from_attributes = True

class ReviewMediaOut(BaseModel):
    id          : int
    public_url  : str
    file_key    : str
    mime_type   : str
    size_bytes  : int
    created_at  : datetime

    class Config:
        from_attributes = True

class ReviewOut(BaseModel):
    id          : int
    property_id : int
    student_id  : int
    reviewer_role: str = "student"
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    booking_id  : Optional[int] = None
    visit_id    : Optional[int] = None
    rating      : int
    comment     : Optional[str] = None
    is_visible  : bool
    created_at  : datetime
    reply       : Optional[ReviewReplyOut] = None
    media       : List[ReviewMediaOut] = []

    class Config:
        from_attributes = True

class PropertyRatingSummary(BaseModel):
    property_id   : int
    average_rating: float
    total_reviews : int
