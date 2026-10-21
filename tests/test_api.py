import os
import sys
import shutil
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Set up project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Setup isolated test database and upload directory
TEST_DIR = PROJECT_ROOT / "tests" / "test_sandbox"
TEST_DIR.mkdir(parents=True, exist_ok=True)
TEST_DB_PATH = TEST_DIR / "test_smartloan.db"
TEST_UPLOAD_DIR = TEST_DIR / "test_uploads"
TEST_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Point config upload dir to test upload dir for isolation
import backend.config as config
config.UPLOAD_DIR = TEST_UPLOAD_DIR
import backend.documents as docs_module
docs_module.upload_path = TEST_UPLOAD_DIR

from backend.database import Base, get_db
from backend.models import User, Bank, LoanProduct, Applicant, LoanApplication
from backend.main import app
from ml.predict import predict_loan
from backend.services import calculate_emi, calculate_dti, calculate_loan_to_income

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
test_engine = create_engine(f"sqlite:///{TEST_DB_PATH}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Create fresh schema in test database
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass

    Base.metadata.create_all(bind=test_engine)

    # Seed test bank and test officer
    db = TestingSessionLocal()
    try:
        test_bank = Bank(
            name="SBI",
            display_name="State Bank of India",
            type="Public Lender",
            is_active=True
        )
        db.add(test_bank)
        db.commit()
        db.refresh(test_bank)

        test_prod = LoanProduct(
            bank_id=test_bank.id,
            name="SBI Express Loan",
            loan_type="Personal Loan",
            min_cibil=650,
            min_income=200000.0,
            min_loan_amount=25000.0,
            max_loan_amount=2000000.0,
            interest_rate_min=10.5,
            interest_rate_max=15.0,
            processing_fee_percent=1.0,
            min_age=21,
            max_age=60,
            supported_employment="Salaried,Self Employed,Business Owner",
            supported_purposes="Personal,Home,Education,Medical,Vehicle,Business",
            is_active=True
        )
        db.add(test_prod)

        # Seed test bank officer
        officer = User(
            name="Senior Credit Officer",
            email="test_bank@smartloan.ai",
            phone="9000000001",
            password_hash=pwd_context.hash("bank-demo123"),
            otp_verified=True,
            bank_role=True
        )
        db.add(officer)
        db.commit()
    finally:
        db.close()

    yield

    # Teardown
    app.dependency_overrides.clear()
    try:
        shutil.rmtree(TEST_DIR, ignore_errors=True)
    except Exception:
        pass


@pytest.fixture
def client():
    return TestClient(app)


# =========================================================
# 1. APPLICATION STARTUP & HEALTH TESTS
# =========================================================
def test_home_and_health(client):
    r_home = client.get("/")
    assert r_home.status_code == 200
    assert "SmartLoan AI Backend" in r_home.json()["message"]

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "OK"


# =========================================================
# 2. AUTHENTICATION & EMAIL NORMALIZATION TESTS
# =========================================================
def test_applicant_registration_and_email_normalization(client):
    # Mixed-case email
    payload = {
        "name": "Arjun Sharma",
        "email": "  Arjun.Sharma@Test.COM  ",
        "phone": "9812345678",
        "password": "Password123"
    }
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "arjun.sharma@test.com"
    assert "demo_otp" in data

    # Verify with OTP
    otp = data["demo_otp"]
    v_res = client.post("/auth/verify-otp", json={"email": "arjun.sharma@test.com", "otp": otp})
    assert v_res.status_code == 200
    assert v_res.json()["verified"] is True

    # Login with lowercase email
    login_res = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "Password123"})
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["bank_role"] is False


def test_login_invalid_password(client):
    r = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "WrongPassword"})
    assert r.status_code == 401


# =========================================================
# 3. ROLE-BASED ACCESS CONTROL & SECURITY TESTS
# =========================================================
def test_applicant_forbidden_from_bank_portal(client):
    # Login applicant
    login_res = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "Password123"})
    applicant_token = login_res.json()["access_token"]

    # Try accessing bank admin dashboard
    r = client.get("/bank/dashboard", headers={"Authorization": f"Bearer {applicant_token}"})
    assert r.status_code == 403
    assert "Bank staff authorization required" in r.json()["detail"]


def test_bank_officer_login_and_access(client):
    # Login as bank officer
    r = client.post("/bank/login", json={"email": "test_bank@smartloan.ai", "password": "bank-demo123"})
    assert r.status_code == 200
    officer_token = r.json()["access_token"]
    assert r.json()["role"] == "bank_officer"

    # Officer can access bank dashboard
    r_dash = client.get("/bank/dashboard", headers={"Authorization": f"Bearer {officer_token}"})
    assert r_dash.status_code == 200
    assert "summary" in r_dash.json()


# =========================================================
# 4. PINCODE & APPLICANT PROFILE TESTS
# =========================================================
def test_pincode_lookup(client):
    r = client.get("/pincode/440001")
    assert r.status_code == 200
    assert r.json()["city"] == "Nagpur"
    assert r.json()["state"] == "Maharashtra"

    r_invalid = client.get("/pincode/999999")
    assert r_invalid.status_code == 404


def test_applicant_profile_crud(client):
    login_res = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "Password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_data = {
        "age": 29,
        "employment_type": "Salaried",
        "annual_income": 750000.0,
        "monthly_income": 62500.0,
        "existing_loans": 1,
        "existing_emi": 10000.0,
        "loan_amount": 400000.0,
        "loan_term_months": 36,
        "loan_purpose": "Personal",
        "cibil_score": 750,
        "credit_utilization": 0.25,
        "credit_accounts": 3,
        "missed_payments": 0,
        "employment_years": 4.0,
        "pincode": "440001",
        "document_completeness": 0.0
    }

    # Create profile
    r_create = client.post("/applicant/", json=profile_data, headers=headers)
    assert r_create.status_code == 200

    # Retrieve profile
    r_get = client.get("/applicant/", headers=headers)
    assert r_get.status_code == 200
    data = r_get.json()
    assert data["cibil_score"] == 750
    assert data["city"] == "Nagpur"


# =========================================================
# 5. DOCUMENT UPLOAD & AUTHORIZATION TESTS
# =========================================================
def test_document_upload_and_access_control(client):
    # Applicant 1 login
    login_1 = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "Password123"})
    token_1 = login_1.json()["access_token"]
    headers_1 = {"Authorization": f"Bearer {token_1}"}

    # Upload valid document
    file_content = b"%PDF-1.4 test document content"
    files = {"file": ("salary_slip.pdf", file_content, "application/pdf")}
    data = {"document_type": "Income Proof"}

    r_upload = client.post("/documents/upload", headers=headers_1, data=data, files=files)
    assert r_upload.status_code == 200
    doc_id = r_upload.json()["document_id"]
    assert r_upload.json()["document_completeness"] > 0

    # Applicant 1 can download own document
    r_dl_owner = client.get(f"/documents/{doc_id}/download", headers=headers_1)
    assert r_dl_owner.status_code == 200
    assert r_dl_owner.content == file_content

    # Register and login Applicant 2
    client.post("/auth/register", json={"name": "User Two", "email": "user2@test.com", "phone": "9812345679", "password": "Password123"})
    # Verify User 2
    u2_otp = TestingSessionLocal().query(User).filter(User.email == "user2@test.com").first().otp_code
    client.post("/auth/verify-otp", json={"email": "user2@test.com", "otp": u2_otp})
    login_2 = client.post("/auth/login", json={"email": "user2@test.com", "password": "Password123"})
    headers_2 = {"Authorization": f"Bearer {login_2.json()['access_token']}"}

    # Applicant 2 CANNOT download Applicant 1's document (IDOR protection)
    r_dl_attacker = client.get(f"/documents/{doc_id}/download", headers=headers_2)
    assert r_dl_attacker.status_code == 403

    # Bank Officer CAN download document
    login_officer = client.post("/bank/login", json={"email": "test_bank@smartloan.ai", "password": "bank-demo123"})
    headers_officer = {"Authorization": f"Bearer {login_officer.json()['access_token']}"}
    r_dl_officer = client.get(f"/documents/{doc_id}/download", headers=headers_officer)
    assert r_dl_officer.status_code == 200


# =========================================================
# 6. EMI CALCULATOR & ZERO INTEREST HANDLING TESTS
# =========================================================
def test_emi_calculator():
    # Normal reducing balance loan
    emi = calculate_emi(loan_amount=500000, annual_rate=10.5, tenure_months=36)
    assert 16000 < emi < 16500

    # 0% Interest loan must not divide by zero
    zero_emi = calculate_emi(loan_amount=120000, annual_rate=0.0, tenure_months=12)
    assert zero_emi == 10000.0


def test_emi_endpoint(client):
    r = client.post("/applications/emi", json={"loan_amount": 300000, "annual_rate": 12.0, "tenure_months": 24})
    assert r.status_code == 200
    data = r.json()
    assert "monthly_emi" in data
    assert data["monthly_emi"] > 0
    assert data["total_repayment"] > 300000


# =========================================================
# 7. MULTI-BANK MATCHER TESTS
# =========================================================
def test_bank_comparison_endpoint(client):
    login_res = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "Password123"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    r = client.get("/banks/compare", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "eligible_banks" in data
    assert len(data["eligible_banks"]) > 0
    best_bank = data["eligible_banks"][0]
    assert best_bank["match_score"] >= 70


# =========================================================
# 8. APPLICATION SUBMISSION & BANK DECISION WORKFLOW
# =========================================================
def test_loan_application_and_officer_decision_lifecycle(client):
    # Applicant submits loan application
    login_1 = client.post("/auth/login", json={"email": "arjun.sharma@test.com", "password": "Password123"})
    headers_app = {"Authorization": f"Bearer {login_1.json()['access_token']}"}

    db = TestingSessionLocal()
    bank_id = db.query(Bank).first().id
    db.close()

    app_payload = {
        "bank_id": bank_id,
        "loan_amount": 400000.0,
        "loan_term_months": 36,
        "requested_interest_rate": 10.5,
        "notes": "Testing loan submission lifecycle"
    }

    r_submit = client.post("/applications", json=app_payload, headers=headers_app)
    assert r_submit.status_code == 200
    app_data = r_submit.json()
    app_id = app_data["id"]
    assert app_data["status"] == "Submitted"

    # Officer reviews application
    login_officer = client.post("/bank/login", json={"email": "test_bank@smartloan.ai", "password": "bank-demo123"})
    headers_officer = {"Authorization": f"Bearer {login_officer.json()['access_token']}"}

    r_queue = client.get("/bank/applications", headers=headers_officer)
    assert r_queue.status_code == 200
    assert any(a["id"] == app_id for a in r_queue.json())

    # Officer approves application
    r_decide = client.post(
        f"/bank/applications/{app_id}/review",
        json={"decision": "Approved", "reason": "Meets all credit parameters", "notes": "Sanctioned"},
        headers=headers_officer
    )
    assert r_decide.status_code == 200
    assert r_decide.json()["status"] == "Approved"

    # Applicant verifies updated status in their tracker
    r_tracker = client.get(f"/applications/{app_id}", headers=headers_app)
    assert r_tracker.status_code == 200
    assert r_tracker.json()["status"] == "Approved"


# =========================================================
# 9. ML MODEL INFERENCE & SHAP EXPLANATION TESTS
# =========================================================
def test_ml_prediction_pipeline():
    sample = {
        "age": 30,
        "employment_type": "Salaried",
        "annual_income": 800000,
        "monthly_income": 66666.67,
        "existing_loans": 1,
        "existing_emi": 12000,
        "loan_amount": 350000,
        "loan_term_months": 36,
        "cibil_score": 760,
        "credit_utilization": 0.20,
        "credit_accounts": 3,
        "missed_payments": 0,
        "employment_years": 5,
        "loan_purpose": "Personal"
    }

    res = predict_loan(sample)
    assert res["prediction"] in {"APPROVED", "REJECTED"}
    assert 0 <= res["approval_probability"] <= 100
    assert len(res["shap_values"]) > 0
    assert len(res["explanations"]) > 0
    assert len(res["improvement_plan"]) > 0
    assert "synthetic training data" in res["disclaimer"]
