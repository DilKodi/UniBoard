from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database

router = APIRouter(prefix="/owners", tags=["Owners"])

@router.get("/{owner_id}")
def get_owner_profile(owner_id: int, db: Session = Depends(database.get_db)):
    owner = db.query(models.Owner).filter((models.Owner.id == owner_id) | (models.Owner.user_id == owner_id)).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    user = db.query(models.User).filter(models.User.id == owner.user_id).first()
    return {
        "id": owner.id,
        "user_id": owner.user_id,
        "full_name": owner.full_name,
        "email": user.email if user else None,
        "contact_number": owner.contact_number,
        "nic_number": owner.nic_number
    }
