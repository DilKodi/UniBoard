from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import database, models, schemas

router = APIRouter(prefix="/owners", tags=["Owners"])


@router.get("/{owner_id}", response_model=schemas.OwnerProfileResponse)
def get_owner_profile(owner_id: int, db: Session = Depends(database.get_db)):
    owner_record = (
        db.query(models.Owner, models.User)
        .join(models.User, models.Owner.user_id == models.User.id)
        .filter((models.Owner.id == owner_id) | (models.Owner.user_id == owner_id))
        .first()
    )

    if owner_record is None:
        raise HTTPException(status_code=404, detail="Owner not found")

    owner_profile, user = owner_record
    return schemas.OwnerProfileResponse(
        id=owner_profile.id,
        user_id=owner_profile.user_id,
        full_name=owner_profile.full_name,
        email=user.email,
        contact_number=owner_profile.contact_number,
        nic_number=owner_profile.nic_number,
    )