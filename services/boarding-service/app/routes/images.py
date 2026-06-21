from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4
import io

from ..storage import upload_file, delete_file
from ..database import get_db
from ..models import BoardingProperty, BoardingImage

router = APIRouter(prefix="/boardings", tags=["Boarding Images"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5

@router.post("/{property_id}/images")
async def upload_boarding_image(
    property_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify property exists first
    property_exists = db.query(BoardingProperty).filter(BoardingProperty.id == property_id).first()
    if not property_exists:
        raise HTTPException(status_code=404, detail="Property listing not found.")

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File must be under {MAX_SIZE_MB}MB.")

    # Determine file extension safely
    filename = file.filename or "image.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "jpg"

    key = f"boarding/{property_id}/{uuid4()}.{ext}"

    try:
        public_url = upload_file(io.BytesIO(contents), key, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudflare R2: {str(e)}")

    record = BoardingImage(
        property_id=property_id,
        file_key=key,
        public_url=public_url,
        mime_type=file.content_type,
        size_bytes=len(contents)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "property_id": record.property_id,
        "url": record.public_url,
        "key": record.file_key,
        "mime_type": record.mime_type,
        "size_bytes": record.size_bytes,
        "uploaded_at": record.uploaded_at
    }


@router.delete("/{property_id}/images/{image_id}")
def delete_boarding_image(
    property_id: int,
    image_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(BoardingImage).filter(
        BoardingImage.id == image_id,
        BoardingImage.property_id == property_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Image not found for this property.")

    try:
        delete_file(record.file_key)
    except Exception as e:
        # We can still proceed with DB deletion if file does not exist on R2 or just warn,
        # but let's log or raise error depending on context. Raising is safer for consistency.
        raise HTTPException(status_code=500, detail=f"Failed to delete from Cloudflare R2: {str(e)}")

    db.delete(record)
    db.commit()

    return {"message": "Deleted successfully."}


@router.get("/{property_id}/images")
def get_boarding_images(
    property_id: int,
    db: Session = Depends(get_db)
):
    # Verify property exists first
    property_exists = db.query(BoardingProperty).filter(BoardingProperty.id == property_id).first()
    if not property_exists:
        raise HTTPException(status_code=404, detail="Property listing not found.")

    images = db.query(BoardingImage).filter(BoardingImage.property_id == property_id).all()
    return [
        {
            "id": i.id,
            "property_id": i.property_id,
            "url": i.public_url,
            "key": i.file_key,
            "mime_type": i.mime_type,
            "size_bytes": i.size_bytes,
            "uploaded_at": i.uploaded_at
        }
        for i in images
    ]


@router.post("/profile/upload")
async def upload_profile_picture(
    file: UploadFile = File(...)
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File must be under {MAX_SIZE_MB}MB.")

    # Determine file extension safely
    filename = file.filename or "image.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "jpg"

    key = f"profile_pictures/{uuid4()}.{ext}"

    try:
        public_url = upload_file(io.BytesIO(contents), key, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudflare R2: {str(e)}")

    return {"url": public_url}

