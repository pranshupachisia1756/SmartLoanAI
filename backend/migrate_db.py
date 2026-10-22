import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import backend.config
from passlib.context import CryptContext
from backend.database import engine, SessionLocal, Base
from backend.models import User, Applicant, Bank, LoanProduct, LoanApplication, StatusHistory


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def migrate_and_seed():
    print("Initializing SQLite database schema...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

    db = SessionLocal()
    try:
        # 1. Seed Banks & Products
        banks_data = [
            {
                "name": "SBI",
                "display_name": "State Bank of India",
                "type": "Public Lender",
                "official_url": "https://sbi.co.in",
                "approval_time_display": "3 to 7 working days",
                "products": [
                    {
                        "name": "SBI Xpress Credit Personal Loan",
                        "loan_type": "Personal Loan",
                        "min_cibil": 650,
                        "min_income": 200000.0,
                        "min_loan_amount": 25000.0,
                        "max_loan_amount": 2000000.0,
                        "interest_rate_min": 10.50,
                        "interest_rate_max": 14.50,
                        "processing_fee_percent": 1.0,
                        "min_age": 21,
                        "max_age": 60,
                        "supported_employment": "Salaried,Self Employed,Business Owner",
                        "supported_purposes": "Personal,Home,Education,Medical,Vehicle,Business",
                        "approval_time_display": "3 to 7 working days"
                    }
                ]
            },
            {
                "name": "HDFC Bank",
                "display_name": "HDFC Bank",
                "type": "Private Lender",
                "official_url": "https://www.hdfcbank.com",
                "approval_time_display": "Instant to 48 hrs / 2-4 days",
                "products": [
                    {
                        "name": "HDFC Quick Cash Personal Loan",
                        "loan_type": "Personal Loan",
                        "min_cibil": 680,
                        "min_income": 300000.0,
                        "min_loan_amount": 50000.0,
                        "max_loan_amount": 4000000.0,
                        "interest_rate_min": 10.75,
                        "interest_rate_max": 16.00,
                        "processing_fee_percent": 1.25,
                        "min_age": 21,
                        "max_age": 60,
                        "supported_employment": "Salaried,Self Employed,Business Owner",
                        "supported_purposes": "Personal,Home,Education,Medical,Vehicle,Business",
                        "approval_time_display": "Instant to 48 hrs / 2-4 days"
                    }
                ]
            },
            {
                "name": "ICICI Bank",
                "display_name": "ICICI Bank",
                "type": "Private Lender",
                "official_url": "https://www.icicibank.com",
                "approval_time_display": "24 to 72 hours",
                "products": [
                    {
                        "name": "ICICI Dream Loan Solution",
                        "loan_type": "Personal Loan",
                        "min_cibil": 700,
                        "min_income": 250000.0,
                        "min_loan_amount": 50000.0,
                        "max_loan_amount": 5000000.0,
                        "interest_rate_min": 10.85,
                        "interest_rate_max": 16.50,
                        "processing_fee_percent": 1.5,
                        "min_age": 21,
                        "max_age": 58,
                        "supported_employment": "Salaried,Self Employed,Business Owner",
                        "supported_purposes": "Personal,Home,Education,Medical,Vehicle,Business",
                        "approval_time_display": "24 to 72 hours"
                    }
                ]
            },
            {
                "name": "Axis Bank",
                "display_name": "Axis Bank",
                "type": "Private Lender",
                "official_url": "https://www.axisbank.com",
                "approval_time_display": "2 to 4 working days",
                "products": [
                    {
                        "name": "Axis Bank 24x7 Personal Loan",
                        "loan_type": "Personal Loan",
                        "min_cibil": 670,
                        "min_income": 240000.0,
                        "min_loan_amount": 50000.0,
                        "max_loan_amount": 4000000.0,
                        "interest_rate_min": 10.99,
                        "interest_rate_max": 16.75,
                        "processing_fee_percent": 1.5,
                        "min_age": 21,
                        "max_age": 60,
                        "supported_employment": "Salaried,Self Employed,Business Owner",
                        "supported_purposes": "Personal,Home,Education,Medical,Vehicle,Business",
                        "approval_time_display": "2 to 4 working days"
                    }
                ]
            }
        ]

        for b_data in banks_data:
            existing_bank = db.query(Bank).filter(Bank.name == b_data["name"]).first()
            if not existing_bank:
                new_bank = Bank(
                    name=b_data["name"],
                    display_name=b_data["display_name"],
                    type=b_data["type"],
                    official_url=b_data["official_url"],
                    approval_time_display=b_data["approval_time_display"],
                    is_active=True
                )
                db.add(new_bank)
                db.commit()
                db.refresh(new_bank)
                existing_bank = new_bank

            # Seed loan products
            for p_data in b_data["products"]:
                existing_prod = db.query(LoanProduct).filter(
                    LoanProduct.bank_id == existing_bank.id,
                    LoanProduct.name == p_data["name"]
                ).first()
                if not existing_prod:
                    new_prod = LoanProduct(
                        bank_id=existing_bank.id,
                        name=p_data["name"],
                        loan_type=p_data["loan_type"],
                        min_cibil=p_data["min_cibil"],
                        min_income=p_data["min_income"],
                        min_loan_amount=p_data["min_loan_amount"],
                        max_loan_amount=p_data["max_loan_amount"],
                        interest_rate_min=p_data["interest_rate_min"],
                        interest_rate_max=p_data["interest_rate_max"],
                        processing_fee_percent=p_data["processing_fee_percent"],
                        min_age=p_data["min_age"],
                        max_age=p_data["max_age"],
                        supported_employment=p_data["supported_employment"],
                        supported_purposes=p_data["supported_purposes"],
                        approval_time_display=p_data["approval_time_display"],
                        is_active=True
                    )
                    db.add(new_prod)

        db.commit()
        print("Pre-seeded official banks and loan products.")

        # 2. Seed Demo Bank Underwriting Officer
        officer = db.query(User).filter(User.email == "bank@smartloan.ai").first()
        if not officer:
            officer = User(
                name="Senior Credit Officer",
                email="bank@smartloan.ai",
                phone="9000000001",
                password_hash=pwd_context.hash("bank-demo123"),
                otp_verified=True,
                bank_role=True
            )
            db.add(officer)
            db.commit()
            print("Pre-seeded Bank Officer account: bank@smartloan.ai / bank-demo123")

        # 3. Seed Demo Applicant
        applicant_user = db.query(User).filter(User.email == "pranshu2@test.com").first()
        if not applicant_user:
            applicant_user = User(
                name="Pranshu Sharma",
                email="pranshu2@test.com",
                phone="9876543210",
                password_hash=pwd_context.hash("Password123"),
                otp_verified=True,
                bank_role=False
            )
            db.add(applicant_user)
            db.commit()
            db.refresh(applicant_user)

            applicant_profile = Applicant(
                user_id=applicant_user.id,
                age=29,
                employment_type="Salaried",
                annual_income=750000.0,
                monthly_income=62500.0,
                existing_loans=1,
                existing_emi=10000.0,
                loan_amount=400000.0,
                loan_term_months=36,
                loan_purpose="Personal",
                cibil_score=750,
                credit_utilization=0.25,
                credit_accounts=3,
                missed_payments=0,
                employment_years=4.0,
                pincode="440001",
                city="Nagpur",
                district="Nagpur",
                state="Maharashtra",
                document_completeness=0.8
            )
            db.add(applicant_profile)
            db.commit()
            db.refresh(applicant_profile)

            # Seed a sample application
            sbi_bank = db.query(Bank).filter(Bank.name == "SBI").first()
            if sbi_bank:
                demo_app = LoanApplication(
                    application_id="SL-2026-SBI101",
                    applicant_id=applicant_profile.id,
                    bank_id=sbi_bank.id,
                    loan_amount=400000.0,
                    loan_term_months=36,
                    requested_interest_rate=10.5,
                    notes="Academic project evaluation loan application",
                    status="Submitted"
                )
                db.add(demo_app)
                db.commit()
                db.refresh(demo_app)

                history = StatusHistory(
                    application_id=demo_app.id,
                    status="Submitted",
                    notes="Application received and queued for credit officer review"
                )
                db.add(history)
                db.commit()

            print("Pre-seeded Applicant account: pranshu2@test.com / Password123")

    finally:
        db.close()

    print("\nDatabase initialization and migration completed successfully!")


if __name__ == "__main__":
    migrate_and_seed()
