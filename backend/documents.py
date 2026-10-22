import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from backend.config import UPLOAD_DIR, MAX_UPLOAD_BYTES
from backend.models import Document, Applicant

# Upload path dynamically referenced and overridable for tests
upload_path = UPLOAD_DIR

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

# Magic byte signatures for security validation
MAGIC_SIGNATURES = {
    b"%PDF": "application/pdf",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"\xff\xd8\xff": "image/jpeg"
}

MANDATORY_DOC_TYPES = [
    "PAN Card",
    "Aadhaar / KYC",
    "Income Proof",
    "Bank Statement",
    "Employment / Business Proof"
]


def validate_file_signature(content: bytes) -> str:
    for sig, mime in MAGIC_SIGNATURES.items():
        if content.startswith(sig):
            return mime
    # Allow fallback if standard header matches plain PDF marker
    if content.startswith(b"%PDF"):
        return "application/pdf"
    return ""


def calculate_applicant_completeness(applicant_id: int, db: Session) -> float:
    uploaded_docs = db.query(Document).filter(Document.applicant_id == applicant_id).all()
    uploaded_types = {d.document_type for d in uploaded_docs}
    matched = sum(1 for req in MANDATORY_DOC_TYPES if req in uploaded_types)
    completeness = min(1.0, round(matched / len(MANDATORY_DOC_TYPES), 2))
    return completeness


async def save_uploaded_document(
    file: UploadFile,
    document_type: str,
    applicant: Applicant,
    db: Session
) -> Document:
    # 1. Validate file extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Supported formats: PDF, PNG, JPG, JPEG"
        )

    # 2. Read content and validate size
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum permissible size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"
        )

    # 3. Security signature verification
    detected_mime = validate_file_signature(content)
    if not detected_mime and ext == ".pdf" and b"%PDF" in content[:1024]:
        detected_mime = "application/pdf"

    if not detected_mime:
        # Fallback to declared content_type if allowed
        if file.content_type in ["application/pdf", "image/png", "image/jpeg"]:
            detected_mime = file.content_type
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security validation failed: File binary signature does not match declared type"
            )

    # 4. Save file to disk with randomized UUID
    dest_dir = Path(upload_path)
    dest_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    file_disk_path = dest_dir / safe_name
    file_disk_path.write_bytes(content)

    # 5. Check if document of same type already exists for applicant
    existing = db.query(Document).filter(
        Document.applicant_id == applicant.id,
        Document.document_type == document_type
    ).first()

    if existing:
        # Update existing record
        existing.file_name = file.filename
        existing.stored_filename = safe_name
        existing.file_size = len(content)
        existing.mime_type = detected_mime
        existing.file_path = str(file_disk_path)
        existing.review_status = "Pending"
        existing.review_reason = None
        db_doc = existing
    else:
        # Create new record
        db_doc = Document(
            applicant_id=applicant.id,
            document_type=document_type,
            file_name=file.filename,
            stored_filename=safe_name,
            file_size=len(content),
            mime_type=detected_mime,
            file_path=str(file_disk_path),
            review_status="Pending"
        )
        db.add(db_doc)

    db.commit()
    db.refresh(db_doc)

    # Update applicant completeness score
    completeness = calculate_applicant_completeness(applicant.id, db)
    applicant.document_completeness = completeness
    db.commit()

    return db_doc
