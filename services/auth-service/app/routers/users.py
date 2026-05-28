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
