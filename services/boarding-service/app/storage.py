import boto3
import os
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

def get_r2_client():
    account_id = os.getenv("CF_ACCOUNT_ID")
    access_key = os.getenv("CF_ACCESS_KEY_ID")
    secret_key = os.getenv("CF_SECRET_ACCESS_KEY")
    
    if not all([account_id, access_key, secret_key]):
        raise RuntimeError("Missing Cloudflare R2 credentials in environment variables.")
        
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

BUCKET = os.getenv("R2_BUCKET_NAME", "uniboard-files")
PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "https://pub-da9762b0d6c94d1c8a54768b1e585278.r2.dev").rstrip("/")

def upload_file(file_obj, key: str, content_type: str) -> str:
    """Upload a file to R2 and return its public URL."""
    client = get_r2_client()
    client.upload_fileobj(
        file_obj,
        BUCKET,
        key,
        ExtraArgs={"ContentType": content_type}
    )
    return f"{PUBLIC_URL}/{key}"

def delete_file(key: str):
    """Delete a file from R2 by its key."""
    client = get_r2_client()
    client.delete_object(Bucket=BUCKET, Key=key)

def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a temporary private URL (for sensitive docs like student ID)."""
    client = get_r2_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires_in
    )
