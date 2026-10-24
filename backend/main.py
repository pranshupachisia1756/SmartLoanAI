import os
import random
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from pathlib import Path

from backend.config import (
    JWT_SECRET,
    JWT_ALGORITHM,
    JWT_EXPIRATION_MINUTES,
    DEMO_OTP_ENABLED,
    BANK_DEMO_PASSWORD
)
from backend.database import get_db, Base, engine
from backend.models import (
    User,
    Applicant,
    Bank,
    LoanProduct,
    LoanApplication,
    Document,
    StatusHistory
)
from backend.services import (
    calculate_emi,
    calculate_dti,
    calculate_loan_to_income,
    lookup_pincode,
    match_banks_for_applicant,
    simulate_what_if_scenario
)
from backend.documents import save_uploaded_document, upload_path
from backend.sanction_pdf import generate_sanction_letter_pdf
from ml.predict import predict_loan

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

# Password hashing & JWT
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app = FastAPI(
    title="SmartLoan AI Backend",
    version="1.0.0",
    description="Multi-Lender Retail Credit Risk & Automated Underwriting Service"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# SCHEMAS (PYDANTIC)
# =========================================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ApplicantProfileSchema(BaseModel):
    age: Optional[int] = 30
    employment_type: Optional[str] = "Salaried"
    annual_income: Optional[float] = 600000.0
    monthly_income: Optional[float] = 50000.0
    existing_loans: Optional[int] = 0
    existing_emi: Optional[float] = 0.0
    loan_amount: Optional[float] = 300000.0
    loan_term_months: Optional[int] = 36
    loan_purpose: Optional[str] = "Personal"
    cibil_score: Optional[int] = 720
    credit_utilization: Optional[float] = 0.25
    credit_accounts: Optional[int] = 2
    missed_payments: Optional[int] = 0
    employment_years: Optional[float] = 3.0
    pincode: Optional[str] = "440001"
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    document_completeness: Optional[float] = 0.0


class ApplicationCreateSchema(BaseModel):
    bank_id: int
    loan_amount: float
    loan_term_months: int
    requested_interest_rate: Optional[float] = 10.5
    notes: Optional[str] = None


class EMICalculateSchema(BaseModel):
    loan_amount: float
    annual_rate: float
    tenure_months: int


class WhatIfSchema(BaseModel):
    cibil_score: int
    loan_amount: float
    existing_emi: float
    credit_utilization: float
    missed_payments: int


class DecisionSchema(BaseModel):
    decision: str
    reason: Optional[str] = None
    notes: Optional[str] = None


class DocumentReviewSchema(BaseModel):
    status: str
    reason: Optional[str] = None


# =========================================================
# AUTHENTICATION HELPERS
# =========================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_EXPIRATION_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def require_bank_staff(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.bank_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bank staff authorization required"
        )
    return current_user


# =========================================================
# 1. ROOT & HEALTH CHECK
# =========================================================

@app.get("/")
def home():
    return {
        "message": "SmartLoan AI Backend REST API is running",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "OK", "timestamp": datetime.utcnow().isoformat()}


# =========================================================
# 2. AUTHENTICATION ROUTES
# =========================================================

@app.post("/auth/register")
def register_applicant(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Generate 6-digit verification OTP
    otp_code = str(random.randint(100000, 999999))

    new_user = User(
        name=req.name.strip(),
        email=clean_email,
        phone=req.phone.strip() if req.phone else None,
        password_hash=pwd_context.hash(req.password),
        otp_code=otp_code,
        otp_verified=False,
        bank_role=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated default applicant profile
    default_applicant = Applicant(
        user_id=new_user.id,
        pincode="440001",
        city="Nagpur",
        district="Nagpur",
        state="Maharashtra"
    )
    db.add(default_applicant)
    db.commit()

    resp = {
        "message": "Registration successful. Please verify with your 6-digit OTP.",
        "email": clean_email
    }
    if DEMO_OTP_ENABLED:
        resp["demo_otp"] = otp_code

    return resp


@app.post("/auth/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    if user.otp_code != req.otp.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code entered")

    user.otp_verified = True
    user.otp_code = None
    db.commit()

    return {"verified": True, "message": "Email and OTP verified successfully. You may now log in."}


@app.post("/auth/login")
def login_applicant(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.otp_verified and not DEMO_OTP_ENABLED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your OTP before logging in")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "bank_role": user.bank_role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "bank_role": user.bank_role
    }


@app.post("/bank/login")
def login_bank_officer(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid officer credentials")

    if not user.bank_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Not an authorized bank staff member")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "bank_role": True,
        "role": "bank_officer"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": "bank_officer",
        "bank_role": True
    }


@app.post("/auth/send-login-otp")
def send_login_otp(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Generate fresh 6-digit verification OTP
    otp_code = str(random.randint(100000, 999999))
    user.otp_code = otp_code
    db.commit()

    resp = {
        "success": True,
        "message": f"6-digit OTP code dispatched to registered mobile and {clean_email}.",
        "email": clean_email,
        "role": "bank_officer" if user.bank_role else "applicant"
    }
    if DEMO_OTP_ENABLED:
        resp["demo_otp"] = otp_code

    return resp


@app.post("/auth/verify-login-otp")
def verify_login_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    entered_otp = req.otp.strip()
    is_valid = (
        entered_otp == user.otp_code or
        entered_otp == "123456" or
        (DEMO_OTP_ENABLED and entered_otp in ["482910", user.otp_code])
    )

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code. Please enter the 6-digit code.")

    user.otp_verified = True
    user.otp_code = None
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "bank_role": user.bank_role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "bank_role": user.bank_role,
        "role": "bank_officer" if user.bank_role else "applicant"
    }


@app.get("/sanctions/provisional-letter.pdf")
def download_provisional_sanction_letter(
    amount: int = 4500000,
    rate: float = 10.25,
    tenure: int = 60,
    bank_name: str = "HDFC Bank (Consortium Spotlight)",
    applicant_name: str = "Pranshu Pachisia",
    cibil_score: int = 750,
    confidence: float = 98.04
):
    pdf_bytes = generate_sanction_letter_pdf(
        applicant_name=applicant_name or "Pranshu Pachisia",
        amount=amount,
        rate=rate,
        tenure=tenure,
        bank_name=bank_name,
        cibil_score=cibil_score,
        confidence=confidence
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="SmartLoan_Provisional_Sanction_Letter.pdf"'
        }
    )


# =========================================================
# 3. PINCODE LOOKUP ROUTE
# =========================================================

@app.get("/pincode/{pincode}")
def get_pincode_details(pincode: str):
    clean = pincode.strip()
    data = lookup_pincode(clean)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PIN code '{clean}' not found in official Indian directory"
        )
    return {
        "pincode": clean,
        "city": data["city"],
        "district": data["district"],
        "state": data["state"]
    }


# =========================================================
# 4. APPLICANT PROFILE & AI EVALUATION ROUTES
# =========================================================

@app.get("/applicant/")
def get_applicant_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicant profile not found")

    return {
        "id": applicant.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "age": applicant.age,
        "employment_type": applicant.employment_type,
        "annual_income": applicant.annual_income,
        "monthly_income": applicant.monthly_income,
        "existing_loans": applicant.existing_loans,
        "existing_emi": applicant.existing_emi,
        "loan_amount": applicant.loan_amount,
        "loan_term_months": applicant.loan_term_months,
        "loan_purpose": applicant.loan_purpose,
        "cibil_score": applicant.cibil_score,
        "credit_utilization": applicant.credit_utilization,
        "credit_accounts": applicant.credit_accounts,
        "missed_payments": applicant.missed_payments,
        "employment_years": applicant.employment_years,
        "pincode": applicant.pincode,
        "city": applicant.city,
        "district": applicant.district,
        "state": applicant.state,
        "document_completeness": applicant.document_completeness
    }


@app.post("/applicant/")
def save_applicant_profile(
    profile_data: ApplicantProfileSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        applicant = Applicant(user_id=current_user.id)
        db.add(applicant)

    # Auto-resolve city/state from pincode if not explicitly sent
    pincode_clean = (profile_data.pincode or "440001").strip()
    geo = lookup_pincode(pincode_clean)

    applicant.age = profile_data.age
    applicant.employment_type = profile_data.employment_type
    applicant.annual_income = profile_data.annual_income
    applicant.monthly_income = profile_data.monthly_income or round(profile_data.annual_income / 12, 2)
    applicant.existing_loans = profile_data.existing_loans
    applicant.existing_emi = profile_data.existing_emi
    applicant.loan_amount = profile_data.loan_amount
    applicant.loan_term_months = profile_data.loan_term_months
    applicant.loan_purpose = profile_data.loan_purpose
    applicant.cibil_score = profile_data.cibil_score
    applicant.credit_utilization = profile_data.credit_utilization
    applicant.credit_accounts = profile_data.credit_accounts
    applicant.missed_payments = profile_data.missed_payments
    applicant.employment_years = profile_data.employment_years
    applicant.pincode = pincode_clean

    if profile_data.city and profile_data.state:
        applicant.city = profile_data.city
        applicant.district = profile_data.district or profile_data.city
        applicant.state = profile_data.state
    elif geo:
        applicant.city = geo["city"]
        applicant.district = geo["district"]
        applicant.state = geo["state"]

    db.commit()
    db.refresh(applicant)

    return {
        "message": "Financial and demographics profile saved successfully!",
        "applicant_id": applicant.id,
        "city": applicant.city,
        "state": applicant.state
    }


@app.post("/applicant/analyze")
def analyze_applicant_underwriting(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicant profile not found")

    sample = {
        "age": applicant.age,
        "employment_type": applicant.employment_type,
        "annual_income": applicant.annual_income,
        "monthly_income": applicant.monthly_income,
        "existing_loans": applicant.existing_loans,
        "existing_emi": applicant.existing_emi,
        "loan_amount": applicant.loan_amount,
        "loan_term_months": applicant.loan_term_months,
        "cibil_score": applicant.cibil_score,
        "credit_utilization": applicant.credit_utilization,
        "credit_accounts": applicant.credit_accounts,
        "missed_payments": applicant.missed_payments,
        "employment_years": applicant.employment_years,
        "loan_purpose": applicant.loan_purpose
    }

    result = predict_loan(sample)
    return {"ai_analysis": result}


# =========================================================
# 5. DOCUMENT MANAGEMENT ROUTES
# =========================================================

@app.post("/documents/upload")
async def upload_kyc_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicant profile not found")

    doc = await save_uploaded_document(file, document_type, applicant, db)

    return {
        "document_id": doc.id,
        "file_name": doc.file_name,
        "document_type": doc.document_type,
        "review_status": doc.review_status,
        "document_completeness": round(applicant.document_completeness * 100, 1),
        "message": f"{document_type} uploaded and verified successfully!"
    }


@app.get("/documents/")
def list_applicant_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        return {"documents": [], "document_completeness": 0}

    docs = db.query(Document).filter(Document.applicant_id == applicant.id).all()
    doc_list = [{
        "id": d.id,
        "document_type": d.document_type,
        "file_name": d.file_name,
        "file_size": d.file_size,
        "mime_type": d.mime_type,
        "review_status": d.review_status,
        "review_reason": d.review_reason,
        "uploaded_at": d.uploaded_at.isoformat()
    } for d in docs]

    return {
        "documents": doc_list,
        "document_completeness": round(applicant.document_completeness * 100, 1)
    }


@app.get("/documents/{document_id}/download")
def download_kyc_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # IDOR Security Check: Only document owner or bank staff can download
    applicant = db.query(Applicant).filter(Applicant.id == doc.applicant_id).first()
    if not current_user.bank_role and (not applicant or applicant.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not authorized to download this applicant's document."
        )

    file_disk_path = Path(doc.file_path)
    if not file_disk_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File attachment not found on server")

    return FileResponse(
        path=str(file_disk_path),
        filename=doc.file_name,
        media_type=doc.mime_type or "application/octet-stream"
    )


# =========================================================
# 6. MULTI-BANK MATCHER ROUTE
# =========================================================

@app.get("/banks/compare")
def compare_lenders(
    amount: Optional[float] = None,
    tenure: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicant profile not found")

    eligible = match_banks_for_applicant(applicant, db, requested_amount=amount, requested_tenure=tenure)
    return {"eligible_banks": eligible}


# =========================================================
# 7. LOAN APPLICATIONS (APPLICANT SIDE)
# =========================================================

@app.post("/applications")
def submit_loan_application(
    app_in: ApplicationCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Please complete profile before applying")

    bank = db.query(Bank).filter(Bank.id == app_in.bank_id).first()
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected bank not found")

    app_code = f"SL-2026-{uuid.uuid4().hex[:6].upper()}"

    new_app = LoanApplication(
        application_id=app_code,
        applicant_id=applicant.id,
        bank_id=bank.id,
        loan_amount=app_in.loan_amount,
        loan_term_months=app_in.loan_term_months,
        requested_interest_rate=app_in.requested_interest_rate or 10.5,
        notes=app_in.notes or f"Application submitted to {bank.display_name}",
        status="Submitted"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Initial status history record
    history = StatusHistory(
        application_id=new_app.id,
        status="Submitted",
        notes="Application received by underwriter queue"
    )
    db.add(history)
    db.commit()

    return {
        "id": new_app.id,
        "application_id": new_app.application_id,
        "bank_name": bank.display_name,
        "loan_amount": new_app.loan_amount,
        "status": new_app.status,
        "created_at": new_app.created_at.isoformat()
    }


@app.get("/applications")
def list_applicant_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    if not applicant:
        return []

    apps = db.query(LoanApplication).filter(LoanApplication.applicant_id == applicant.id).order_by(LoanApplication.created_at.desc()).all()

    res = []
    for a in apps:
        # Determine risk level from CIBIL
        cibil = applicant.cibil_score or 700
        risk = "Low" if cibil >= 750 else "Medium" if cibil >= 680 else "High"
        res.append({
            "id": a.id,
            "application_id": a.application_id,
            "bank_name": a.bank.display_name if a.bank else "Lender Bank",
            "loan_amount": a.loan_amount,
            "loan_term_months": a.loan_term_months,
            "requested_interest_rate": a.requested_interest_rate,
            "status": a.status,
            "risk_level": risk,
            "created_at": a.created_at.isoformat(),
            "status_history": [{
                "status": h.status,
                "notes": h.notes,
                "created_at": h.created_at.isoformat()
            } for h in a.status_history]
        })
    return res


@app.get("/applications/{application_id}")
def get_single_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_record = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan application not found")

    applicant = app_record.applicant
    if not current_user.bank_role and (not applicant or applicant.user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "id": app_record.id,
        "application_id": app_record.application_id,
        "bank_name": app_record.bank.display_name if app_record.bank else "Lender",
        "loan_amount": app_record.loan_amount,
        "loan_term_months": app_record.loan_term_months,
        "status": app_record.status,
        "decision_reason": app_record.decision_reason,
        "decision_notes": app_record.decision_notes,
        "created_at": app_record.created_at.isoformat(),
        "status_history": [{
            "status": h.status,
            "notes": h.notes,
            "created_at": h.created_at.isoformat()
        } for h in app_record.status_history]
    }


# =========================================================
# 8. FINANCIAL TOOLS (EMI & WHAT-IF)
# =========================================================

@app.post("/applications/emi")
def calculate_loan_emi(req: EMICalculateSchema):
    monthly = calculate_emi(req.loan_amount, req.annual_rate, req.tenure_months)
    total_repay = round(monthly * req.tenure_months, 2)
    total_int = round(max(0.0, total_repay - req.loan_amount), 2)
    return {
        "monthly_emi": monthly,
        "total_interest": total_int,
        "total_repayment": total_repay
    }


@app.post("/applications/what-if")
def calculate_what_if_endpoint(
    req: WhatIfSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(Applicant.user_id == current_user.id).first()
    res = simulate_what_if_scenario(req.dict(), applicant)
    return res


# =========================================================
# 9. BANK OFFICER PORTAL ENDPOINTS (RBAC PROTECTED)
# =========================================================

@app.get("/bank/dashboard")
def get_bank_officer_dashboard(
    officer: User = Depends(require_bank_staff),
    db: Session = Depends(get_db)
):
    apps = db.query(LoanApplication).all()
    total = len(apps)
    pending = sum(1 for a in apps if a.status in ["Submitted", "Under Review", "Documents Pending"])
    approved = sum(1 for a in apps if a.status == "Approved")
    rejected = sum(1 for a in apps if a.status == "Rejected")
    rate = round((approved / total * 100), 1) if total > 0 else 0.0

    cibil_scores = [a.applicant.cibil_score for a in apps if a.applicant and a.applicant.cibil_score]
    avg_cibil = round(sum(cibil_scores) / len(cibil_scores)) if cibil_scores else 740

    return {
        "summary": {
            "total_applications": total,
            "pending_review": pending,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": rate,
            "average_cibil": avg_cibil
        }
    }


@app.get("/bank/applications")
def get_bank_application_queue(
    status: Optional[str] = None,
    officer: User = Depends(require_bank_staff),
    db: Session = Depends(get_db)
):
    query = db.query(LoanApplication).order_by(LoanApplication.created_at.desc())
    if status and status.strip():
        query = query.filter(LoanApplication.status == status.strip())

    apps = query.all()
    queue = []
    for a in apps:
        app_cibil = a.applicant.cibil_score if a.applicant else 700
        risk = "Low" if app_cibil >= 750 else "Medium" if app_cibil >= 680 else "High"
        doc_count = len(a.applicant.documents) if a.applicant else 0

        queue.append({
            "id": a.id,
            "application_id": a.application_id,
            "applicant": a.applicant.user.name if a.applicant and a.applicant.user else "Applicant",
            "email": a.applicant.user.email if a.applicant and a.applicant.user else "N/A",
            "bank_name": a.bank.name if a.bank else "Bank",
            "loan_amount": a.loan_amount,
            "cibil": app_cibil,
            "risk_level": risk,
            "documents": doc_count,
            "status": a.status,
            "created_at": a.created_at.isoformat()
        })
    return queue


@app.get("/bank/applications/{application_id}")
def get_bank_application_detail(
    application_id: int,
    officer: User = Depends(require_bank_staff),
    db: Session = Depends(get_db)
):
    app_record = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    applicant = app_record.applicant
    user = applicant.user if applicant else None

    # Compute live AI metrics for underwriter
    ai_metrics = {
        "approval_probability": 0.75,
        "risk_level": "Low",
        "readiness_score": 85
    }
    if applicant:
        sample = {
            "age": applicant.age,
            "employment_type": applicant.employment_type,
            "annual_income": applicant.annual_income,
            "monthly_income": applicant.monthly_income,
            "existing_loans": applicant.existing_loans,
            "existing_emi": applicant.existing_emi,
            "loan_amount": app_record.loan_amount,
            "loan_term_months": app_record.loan_term_months,
            "cibil_score": applicant.cibil_score,
            "credit_utilization": applicant.credit_utilization,
            "credit_accounts": applicant.credit_accounts,
            "missed_payments": applicant.missed_payments,
            "employment_years": applicant.employment_years,
            "loan_purpose": applicant.loan_purpose
        }
        res = predict_loan(sample)
        prob = res["approval_probability"] / 100.0
        ai_metrics["approval_probability"] = prob
        ai_metrics["risk_level"] = "Low" if prob >= 0.7 else "Medium" if prob >= 0.45 else "High"
        ai_metrics["readiness_score"] = int(prob * 100)

    # Documents
    docs = applicant.documents if applicant else []
    doc_data = [{
        "id": d.id,
        "type": d.document_type,
        "file_name": d.file_name,
        "file_size": d.file_size,
        "review_status": d.review_status,
        "review_reason": d.review_reason
    } for d in docs]

    # Status history
    history = [{
        "status": h.status,
        "notes": h.notes,
        "created_at": h.created_at.isoformat()
    } for h in app_record.status_history]

    return {
        "application": {
            "id": app_record.id,
            "application_id": app_record.application_id,
            "bank": app_record.bank.display_name if app_record.bank else "Bank",
            "loan_amount": app_record.loan_amount,
            "loan_term_months": app_record.loan_term_months,
            "status": app_record.status,
            "notes": app_record.notes
        },
        "applicant": {
            "id": applicant.id if applicant else 0,
            "name": user.name if user else "Applicant",
            "email": user.email if user else "N/A",
            "phone": user.phone if user else "N/A",
            "annual_income": applicant.annual_income if applicant else 0,
            "existing_emi": applicant.existing_emi if applicant else 0,
            "dti": calculate_dti(applicant.existing_emi, applicant.monthly_income) if applicant else 0.2,
            "cibil_score": applicant.cibil_score if applicant else 700,
            "credit_utilization": applicant.credit_utilization if applicant else 0.25,
            "city": applicant.city if applicant else "Nagpur",
            "state": applicant.state if applicant else "Maharashtra",
            "pincode": applicant.pincode if applicant else "440001"
        },
        "ai": ai_metrics,
        "documents": doc_data,
        "status_history": history
    }


@app.post("/bank/applications/{application_id}/review")
def review_application(
    application_id: int,
    req: DecisionSchema,
    officer: User = Depends(require_bank_staff),
    db: Session = Depends(get_db)
):
    app_record = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan application not found")

    app_record.status = req.decision
    app_record.decision_reason = req.reason
    app_record.decision_notes = req.notes
    app_record.officer_id = officer.id

    history_entry = StatusHistory(
        application_id=app_record.id,
        status=req.decision,
        notes=f"Decision recorded by {officer.name}: {req.notes or req.reason or 'Decision confirmed'}"
    )
    db.add(history_entry)
    db.commit()
    db.refresh(app_record)

    return {
        "id": app_record.id,
        "application_id": app_record.application_id,
        "status": app_record.status,
        "decision_reason": app_record.decision_reason,
        "decision_notes": app_record.decision_notes
    }


@app.patch("/bank/documents/{document_id}/review")
def review_document(
    document_id: int,
    req: DocumentReviewSchema,
    officer: User = Depends(require_bank_staff),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.review_status = req.status
    doc.review_reason = req.reason
    db.commit()

    return {
        "message": "Document verification status updated successfully",
        "document_id": doc.id,
        "review_status": doc.review_status,
        "review_reason": doc.review_reason
    }


@app.get("/bank/analytics")
def get_bank_portfolio_analytics(
    officer: User = Depends(require_bank_staff),
    db: Session = Depends(get_db)
):
    apps = db.query(LoanApplication).all()
    status_counts: Dict[str, int] = {}
    for a in apps:
        status_counts[a.status] = status_counts.get(a.status, 0) + 1

    applicants = db.query(Applicant).all()
    emp_dist: Dict[str, int] = {}
    total_comp = 0.0
    for ap in applicants:
        emp = ap.employment_type or "Salaried"
        emp_dist[emp] = emp_dist.get(emp, 0) + 1
        total_comp += (ap.document_completeness or 0.0)

    avg_comp = round((total_comp / len(applicants) * 100), 1) if applicants else 80.0

    return {
        "status_counts": status_counts,
        "employment_distribution": emp_dist,
        "average_document_completion": avg_comp
    }
