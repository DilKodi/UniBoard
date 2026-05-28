from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from .. import models, schemas, utils, database

router = APIRouter(tags=["Authentication"])

@router.post("/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.role == models.UserRole.STUDENT:
        new_profile = models.Student(
            user_id=new_user.id,
            full_name=user.full_name,
            university=user.university,
        )
        db.add(new_profile)
    elif user.role == models.UserRole.OWNER:
        new_profile = models.Owner(
            user_id=new_user.id,
            full_name=user.full_name,
            nic_number=user.nic_number,
            contact_number=user.contact_number,
        )
        db.add(new_profile)

    db.commit()
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = utils.create_access_token(
        data={"sub": user.email, "role": user.role.value, "id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}
