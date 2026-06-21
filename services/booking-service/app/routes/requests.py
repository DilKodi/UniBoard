from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import httpx
from .. import models, schemas, database

router = APIRouter(prefix="/bookings", tags=["Bookings & Visits"])

def _get_property_owner_id(property_id: int) -> int | None:
    for url_pattern in ["http://boarding-service:8003/boardings/{}", "http://localhost:8003/boardings/{}"]:
        try:
            resp = httpx.get(url_pattern.format(property_id), timeout=2.0)
            if resp.status_code == 200:
                return resp.json().get("owner_id")
        except Exception:
            continue
    return None

def _send_notification(user_id: int, title: str, message: str, type_str: str, action_url: str):
    try:
        payload = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type_str,
            "action_url": action_url
        }
        for url in ["http://notification-service:8006/notifications", "http://localhost:8006/notifications"]:
            try:
                resp = httpx.post(url, json=payload, timeout=2.0)
                if resp.status_code == 201:
                    break
            except Exception:
                continue
    except Exception as e:
        print(f"Failed to send notification: {e}")

@router.post("/visit", response_model=schemas.VisitRequestResponse, status_code=201)
def create_visit_request(
    payload: schemas.VisitRequestCreate,
    db: Session = Depends(database.get_db)
):
    req = models.VisitRequest(
        student_id=payload.student_id,
        student_name=payload.student_name,
        property_id=payload.property_id,
        property_name=payload.property_name,
        room_name=payload.room_name,
        requested_date=payload.requested_date,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify owner of the new visit request
    owner_id = _get_property_owner_id(req.property_id)
    if owner_id:
        _send_notification(
            user_id=owner_id,
            title="New Visit Request 📅",
            message=f"Student {req.student_name} has requested a visit for '{req.property_name}' on {req.requested_date}.",
            type_str="visit_requested",
            action_url="/owner-dashboard"
        )

    return req

@router.post("/booking", response_model=schemas.BookingRequestResponse, status_code=201)
def create_booking_request(
    payload: schemas.BookingRequestCreate,
    db: Session = Depends(database.get_db)
):
    req = models.BookingRequest(
        student_id=payload.student_id,
        student_name=payload.student_name,
        property_id=payload.property_id,
        property_name=payload.property_name,
        room_id=payload.room_id,
        room_name=payload.room_name,
        requested_date=payload.requested_date,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Notify owner of the new booking request
    owner_id = _get_property_owner_id(req.property_id)
    if owner_id:
        _send_notification(
            user_id=owner_id,
            title="New Booking Request 🏠",
            message=f"Student {req.student_name} has requested a booking for room '{req.room_name}' in '{req.property_name}'.",
            type_str="booking_requested",
            action_url="/owner-dashboard"
        )

    return req

@router.get("/property/{property_id}/visits", response_model=List[schemas.VisitRequestResponse])
def get_property_visits(property_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.VisitRequest).filter(models.VisitRequest.property_id == property_id).all()

@router.get("/property/{property_id}/bookings", response_model=List[schemas.BookingRequestResponse])
def get_property_bookings(property_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.BookingRequest).filter(models.BookingRequest.property_id == property_id).all()

@router.get("/student/{student_id}/visits", response_model=List[schemas.VisitRequestResponse])
def get_student_visits(student_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.VisitRequest).filter(models.VisitRequest.student_id == student_id).all()

@router.get("/student/{student_id}/bookings", response_model=List[schemas.BookingRequestResponse])
def get_student_bookings(student_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.BookingRequest).filter(models.BookingRequest.student_id == student_id).all()

@router.patch("/visit/{req_id}", response_model=schemas.VisitRequestResponse)
def update_visit_status(
    req_id: int,
    payload: schemas.RequestStatusUpdate,
    db: Session = Depends(database.get_db)
):
    req = db.query(models.VisitRequest).filter(models.VisitRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Visit request not found")
    
    if payload.status not in ["accepted", "declined", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    req.status = payload.status
    db.commit()
    db.refresh(req)

    # Notify student of the updated status
    status_msg = "approved" if req.status == "accepted" else "declined" if req.status == "declined" else req.status
    emoji = "🎉" if req.status == "accepted" else "❌" if req.status == "declined" else "ℹ️"
    _send_notification(
        user_id=req.student_id,
        title=f"Visit Request {status_msg.capitalize()} {emoji}",
        message=f"Your visit request for '{req.property_name}' has been {status_msg} by the owner.",
        type_str="visit_status_updated",
        action_url="/student-dashboard"
    )

    return req

@router.patch("/booking/{req_id}", response_model=schemas.BookingRequestResponse)
def update_booking_status(
    req_id: int,
    payload: schemas.RequestStatusUpdate,
    db: Session = Depends(database.get_db)
):
    req = db.query(models.BookingRequest).filter(models.BookingRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Booking request not found")
        
    if payload.status not in ["accepted", "declined", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    req.status = payload.status
    db.commit()
    db.refresh(req)

    # Notify student of the updated status
    status_msg = "approved" if req.status == "accepted" else "declined" if req.status == "declined" else req.status
    emoji = "🎉" if req.status == "accepted" else "❌" if req.status == "declined" else "ℹ️"
    _send_notification(
        user_id=req.student_id,
        title=f"Booking Request {status_msg.capitalize()} {emoji}",
        message=f"Your booking request for room '{req.room_name}' in '{req.property_name}' has been {status_msg} by the owner.",
        type_str="booking_status_updated",
        action_url="/student-dashboard"
    )

    return req

@router.get("/{booking_id}/internal")
def get_booking_internal(booking_id: int, db: Session = Depends(database.get_db)):
    booking = db.query(models.BookingRequest).filter(models.BookingRequest.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")
    return {
        "id"        : booking.id,
        "student_id": booking.student_id,
        "property_id": booking.property_id,
        "status"    : booking.status
    }

@router.get("/visits/{visit_id}/internal")
def get_visit_internal(visit_id: int, db: Session = Depends(database.get_db)):
    visit = db.query(models.VisitRequest).filter(models.VisitRequest.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit request not found")
    return {
        "id"        : visit.id,
        "student_id": visit.student_id,
        "property_id": visit.property_id,
        "status"    : visit.status
    }

