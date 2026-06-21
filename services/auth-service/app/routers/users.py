from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database, dependencies

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(dependencies.get_current_active_user)],
)

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_active_user)):
    return current_user

@router.put("/me/student", response_model=schemas.UserResponse)
def update_student_profile(
    profile_data: schemas.StudentProfileUpdate,
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(database.get_db),
):
    if current_user.role != models.UserRole.STUDENT:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="User is not a student")
    
    student = current_user.student_profile
    if not student:
        student = models.Student(user_id=current_user.id)
        db.add(student)
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/owner", response_model=schemas.UserResponse)
def update_owner_profile(
    profile_data: schemas.OwnerProfileUpdate,
    current_user: models.User = Depends(dependencies.get_current_active_user),
    db: Session = Depends(database.get_db),
):
    if current_user.role != models.UserRole.OWNER:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="User is not an owner")
    
    owner = current_user.owner_profile
    if not owner:
        owner = models.Owner(user_id=current_user.id)
        db.add(owner)
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(owner, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user
