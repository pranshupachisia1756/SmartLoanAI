from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    otp_code = Column(String(10), nullable=True)
    otp_verified = Column(Boolean, default=False)
    bank_role = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    applicant = relationship("Applicant", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, default=30)
    employment_type = Column(String(50), default="Salaried")
    annual_income = Column(Float, default=600000.0)
    monthly_income = Column(Float, default=50000.0)
    existing_loans = Column(Integer, default=0)
    existing_emi = Column(Float, default=0.0)
    loan_amount = Column(Float, default=300000.0)
    loan_term_months = Column(Integer, default=36)
    loan_purpose = Column(String(50), default="Personal")
    cibil_score = Column(Integer, default=720)
    credit_utilization = Column(Float, default=0.25)
    credit_accounts = Column(Integer, default=2)
    missed_payments = Column(Integer, default=0)
    employment_years = Column(Float, default=3.0)
    pincode = Column(String(10), default="440001")
    city = Column(String(80), default="Nagpur")
    district = Column(String(80), default="Nagpur")
    state = Column(String(80), default="Maharashtra")
    document_completeness = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applicant")
    documents = relationship("Document", back_populates="applicant", cascade="all, delete-orphan")
    applications = relationship("LoanApplication", back_populates="applicant", cascade="all, delete-orphan")


class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)
    display_name = Column(String(150), nullable=False)
    type = Column(String(50), default="Public Lender")
    is_active = Column(Boolean, default=True)
    official_url = Column(String(255), default="https://www.rbi.org.in")
    logo_url = Column(String(255), nullable=True)
    approval_time_display = Column(String(80), default="3 to 7 working days")
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("LoanProduct", back_populates="bank", cascade="all, delete-orphan")
    applications = relationship("LoanApplication", back_populates="bank")


class LoanProduct(Base):
    __tablename__ = "loan_products"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    name = Column(String(120), nullable=False)
    loan_type = Column(String(50), default="Personal Loan")
    min_cibil = Column(Integer, default=650)
    min_income = Column(Float, default=200000.0)
    min_loan_amount = Column(Float, default=25000.0)
    max_loan_amount = Column(Float, default=2000000.0)
    interest_rate_min = Column(Float, default=10.5)
    interest_rate_max = Column(Float, default=15.0)
    processing_fee_percent = Column(Float, default=1.0)
    min_age = Column(Integer, default=21)
    max_age = Column(Integer, default=60)
    supported_employment = Column(String(200), default="Salaried,Self Employed,Business Owner")
    supported_purposes = Column(String(200), default="Personal,Home,Education,Medical,Vehicle,Business")
    approval_time_display = Column(String(80), default="3 to 5 business days")
    is_active = Column(Boolean, default=True)

    bank = relationship("Bank", back_populates="products")


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(40), unique=True, index=True, nullable=False)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_term_months = Column(Integer, nullable=False)
    requested_interest_rate = Column(Float, default=10.5)
    notes = Column(Text, nullable=True)
    status = Column(String(40), default="Submitted")
    decision_reason = Column(String(255), nullable=True)
    decision_notes = Column(Text, nullable=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = relationship("Applicant", back_populates="applications")
    bank = relationship("Bank", back_populates="applications")
    status_history = relationship("StatusHistory", back_populates="application", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=False)
    document_type = Column(String(60), nullable=False)
    file_name = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="application/pdf")
    file_path = Column(String(500), nullable=False)
    review_status = Column(String(40), default="Pending")
    review_reason = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    applicant = relationship("Applicant", back_populates="documents")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)
    status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("LoanApplication", back_populates="status_history")
