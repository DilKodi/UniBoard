from sqlalchemy import Column, Integer, SmallInteger, Text, Boolean, DateTime, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Review(Base):
    __tablename__ = "reviews"

    id          = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=False, index=True)
    student_id  = Column(Integer, nullable=False, index=True)
    reviewer_role = Column(String, nullable=False, server_default="student")
    reviewer_name = Column(String, nullable=True)
    reviewer_email = Column(String, nullable=True)
    booking_id  = Column(Integer, unique=True, nullable=True)
    visit_id    = Column(Integer, unique=True, nullable=True)
    rating      = Column(SmallInteger, nullable=False)
    comment     = Column(Text)
    is_visible  = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "NOT (booking_id IS NOT NULL AND visit_id IS NOT NULL)",
            name="chk_booking_or_visit"
        ),
    )

    reply = relationship("ReviewReply", back_populates="review", uselist=False, cascade="all, delete-orphan")
    media = relationship("ReviewMedia", back_populates="review", cascade="all, delete-orphan")


class ReviewReply(Base):
    __tablename__ = "review_replies"

    id          = Column(Integer, primary_key=True, index=True)
    review_id   = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, unique=True)
    landlord_id = Column(Integer, nullable=False)
    reply       = Column(Text, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="reply")


class ReviewMedia(Base):
    __tablename__ = "review_media"

    id          = Column(Integer, primary_key=True, index=True)
    review_id   = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    file_key    = Column(String, nullable=False)
    public_url  = Column(String, nullable=False)
    mime_type   = Column(String, nullable=False)
    size_bytes  = Column(Integer, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="media")
