from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.models import Applicant, Bank, LoanProduct
from ml.predict import predict_loan


# =========================================================
# 1. FINANCIAL MATHEMATICS & RATIOS
# =========================================================

def calculate_emi(loan_amount: float, annual_rate: float, tenure_months: int) -> float:
    """
    Standard Amortizing Reducing-Balance EMI calculation.
    Includes zero-interest division-by-zero protection.
    """
    P = float(loan_amount)
    n = int(tenure_months)
    if n <= 0 or P <= 0:
        return 0.0

    r_annual = float(annual_rate)
    if r_annual == 0.0:
        return round(P / n, 2)

    r = (r_annual / 100.0) / 12.0
    factor = (1.0 + r) ** n
    emi = (P * r * factor) / (factor - 1.0)
    return round(emi, 2)


def calculate_dti(existing_emi: float, monthly_income: float) -> float:
    """Debt-to-Income ratio."""
    if monthly_income <= 0:
        return 0.0
    return round(float(existing_emi) / float(monthly_income), 3)


def calculate_loan_to_income(loan_amount: float, annual_income: float) -> float:
    """Loan-to-Income leverage multiple."""
    if annual_income <= 0:
        return 0.0
    return round(float(loan_amount) / float(annual_income), 2)


# =========================================================
# 2. INDIAN PINCODE POSTAL DIRECTORY
# =========================================================

PINCODE_DIRECTORY: Dict[str, Dict[str, str]] = {
    # Maharashtra
    "440001": {"city": "Nagpur", "district": "Nagpur", "state": "Maharashtra"},
    "440010": {"city": "Nagpur", "district": "Nagpur", "state": "Maharashtra"},
    "400001": {"city": "Mumbai", "district": "Mumbai City", "state": "Maharashtra"},
    "400051": {"city": "Mumbai (Bandra)", "district": "Mumbai Suburban", "state": "Maharashtra"},
    "411001": {"city": "Pune", "district": "Pune", "state": "Maharashtra"},
    "411014": {"city": "Pune (Viman Nagar)", "district": "Pune", "state": "Maharashtra"},
    "422001": {"city": "Nashik", "district": "Nashik", "state": "Maharashtra"},
    "431001": {"city": "Chhatrapati Sambhajinagar", "district": "Aurangabad", "state": "Maharashtra"},

    # Delhi NCR
    "110001": {"city": "New Delhi", "district": "Central Delhi", "state": "Delhi"},
    "110016": {"city": "Hauz Khas", "district": "South Delhi", "state": "Delhi"},
    "110092": {"city": "Anand Vihar", "district": "East Delhi", "state": "Delhi"},
    "122001": {"city": "Gurugram", "district": "Gurugram", "state": "Haryana"},
    "201301": {"city": "Noida", "district": "Gautam Buddha Nagar", "state": "Uttar Pradesh"},

    # Karnataka
    "560001": {"city": "Bengaluru", "district": "Bangalore Urban", "state": "Karnataka"},
    "560034": {"city": "Bengaluru (Koramangala)", "district": "Bangalore Urban", "state": "Karnataka"},
    "560066": {"city": "Bengaluru (Whitefield)", "district": "Bangalore Urban", "state": "Karnataka"},
    "570001": {"city": "Mysuru", "district": "Mysore", "state": "Karnataka"},

    # Telangana & Andhra Pradesh
    "500001": {"city": "Hyderabad", "district": "Hyderabad", "state": "Telangana"},
    "500081": {"city": "Hyderabad (Hitec City)", "district": "Ranga Reddy", "state": "Telangana"},
    "530001": {"city": "Visakhapatnam", "district": "Visakhapatnam", "state": "Andhra Pradesh"},
    "520001": {"city": "Vijayawada", "district": "Krishna", "state": "Andhra Pradesh"},

    # Tamil Nadu
    "600001": {"city": "Chennai", "district": "Chennai", "state": "Tamil Nadu"},
    "600034": {"city": "Chennai (Nungambakkam)", "district": "Chennai", "state": "Tamil Nadu"},
    "641001": {"city": "Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu"},

    # West Bengal
    "700001": {"city": "Kolkata", "district": "Kolkata", "state": "West Bengal"},
    "700091": {"city": "Kolkata (Salt Lake)", "district": "North 24 Parganas", "state": "West Bengal"},

    # Gujarat
    "380001": {"city": "Ahmedabad", "district": "Ahmedabad", "state": "Gujarat"},
    "395001": {"city": "Surat", "district": "Surat", "state": "Gujarat"},
    "390001": {"city": "Vadodara", "district": "Vadodara", "state": "Gujarat"},

    # Rajasthan
    "302001": {"city": "Jaipur", "district": "Jaipur", "state": "Rajasthan"},
    "342001": {"city": "Jodhpur", "district": "Jodhpur", "state": "Rajasthan"},

    # Uttar Pradesh & Madhya Pradesh
    "226001": {"city": "Lucknow", "district": "Lucknow", "state": "Uttar Pradesh"},
    "208001": {"city": "Kanpur", "district": "Kanpur Nagar", "state": "Uttar Pradesh"},
    "462001": {"city": "Bhopal", "district": "Bhopal", "state": "Madhya Pradesh"},
    "452001": {"city": "Indore", "district": "Indore", "state": "Madhya Pradesh"},

    # Punjab & Chandigarh
    "160017": {"city": "Chandigarh", "district": "Chandigarh", "state": "Chandigarh"},
    "141001": {"city": "Ludhiana", "district": "Ludhiana", "state": "Punjab"},
    "143001": {"city": "Amritsar", "district": "Amritsar", "state": "Punjab"}
}


def lookup_pincode(pincode: str) -> Optional[Dict[str, str]]:
    clean_code = str(pincode).strip()
    return PINCODE_DIRECTORY.get(clean_code)


# =========================================================
# 3. MULTI-BANK MATCH ENGINE
# =========================================================

def match_banks_for_applicant(
    applicant: Applicant,
    db: Session,
    requested_amount: Optional[float] = None,
    requested_tenure: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Evaluates applicant against institutional criteria for SBI, HDFC, ICICI, and Axis Bank.
    Computes dynamic match scores, verified rates, approval turnaround times, and recommendations.
    """
    amount = float(requested_amount or applicant.loan_amount)
    tenure = int(requested_tenure or applicant.loan_term_months)
    cibil = int(applicant.cibil_score)
    income = float(applicant.annual_income)
    dti = calculate_dti(applicant.existing_emi, applicant.monthly_income)
    emp_type = applicant.employment_type or "Salaried"

    products = db.query(LoanProduct).join(Bank).filter(
        LoanProduct.is_active.is_(True),
        Bank.is_active.is_(True)
    ).all()

    eligible_offers = []

    for prod in products:
        bank = prod.bank
        score = 80  # Base eligibility score

        # 1. CIBIL check
        if cibil < prod.min_cibil:
            score -= 25
        else:
            score += min(15, int((cibil - prod.min_cibil) / 10))

        # 2. Income check
        if income < prod.min_income:
            score -= 20
        else:
            score += 5

        # 3. DTI check
        if dti > 0.50:
            score -= 15
        elif dti <= 0.30:
            score += 8

        # 4. Employment support
        supported_emps = [e.strip() for e in prod.supported_employment.split(",")]
        if emp_type in supported_emps:
            score += 5
        else:
            score -= 15

        # Cap score between 30% and 98%
        final_score = max(35, min(98, score))

        # Check loan range compatibility
        is_amount_in_range = prod.min_loan_amount <= amount <= prod.max_loan_amount

        # Reasons list
        why_recommended = []
        if cibil >= 750:
            why_recommended.append(f"Your CIBIL score of {cibil} qualifies for premium rate tier.")
        elif cibil >= prod.min_cibil:
            why_recommended.append(f"Meets lender minimum CIBIL cut-off ({prod.min_cibil}).")

        if dti <= 0.35:
            why_recommended.append("Healthy debt-to-income ratio indicates low default probability.")

        if is_amount_in_range:
            why_recommended.append(f"Requested loan amount is within sanction limits (₹{int(prod.min_loan_amount):,} - ₹{int(prod.max_loan_amount):,}).")

        why_recommended.append(f"Official Processing Window: {prod.approval_time_display}.")

        # Estimated monthly EMI
        est_emi = calculate_emi(amount, prod.interest_rate_min, tenure)

        offer = {
            "bank_id": bank.id,
            "bank_name": bank.name,
            "bank_display_name": bank.display_name,
            "bank_type": bank.type,
            "product_id": prod.id,
            "product_name": prod.name,
            "match_score": final_score,
            "interest_rate_min": prod.interest_rate_min,
            "interest_rate_max": prod.interest_rate_max,
            "interest_rate_display": f"{prod.interest_rate_min:.2f}% - {prod.interest_rate_max:.2f}% p.a.",
            "processing_fee_percent": prod.processing_fee_percent,
            "processing_fee_display": f"{prod.processing_fee_percent:.2f}% of loan amount",
            "min_loan_amount": prod.min_loan_amount,
            "max_loan_amount": prod.max_loan_amount,
            "approval_time_display": prod.approval_time_display or bank.approval_time_display or "2 to 4 working days",
            "estimated_monthly_emi": est_emi,
            "why_recommended": why_recommended,
            "recommendation": f"High probability match for {bank.display_name} with competitive starting rates at {prod.interest_rate_min:.2f}% p.a.",
            "source_url": bank.official_url
        }
        eligible_offers.append(offer)

    # Sort primarily by match score descending, then by starting rate ascending
    eligible_offers.sort(key=lambda x: (x["match_score"], -x["interest_rate_min"]), reverse=True)
    return eligible_offers


# =========================================================
# 4. INTERACTIVE WHAT-IF SIMULATOR
# =========================================================

def simulate_what_if_scenario(sim_data: dict, current_applicant: Optional[Applicant] = None) -> dict:
    # Use applicant defaults or standard baseline
    base_annual_income = float(current_applicant.annual_income if current_applicant else 720000)
    base_monthly_income = float(current_applicant.monthly_income if current_applicant else base_annual_income / 12)
    base_existing_emi = float(current_applicant.existing_emi if current_applicant else 12000)
    base_cibil = int(current_applicant.cibil_score if current_applicant else 740)
    base_amount = float(current_applicant.loan_amount if current_applicant else 400000)
    base_utilization = float(current_applicant.credit_utilization if current_applicant else 0.25)
    base_missed = int(current_applicant.missed_payments if current_applicant else 0)

    # Current sample
    current_sample = {
        "annual_income": base_annual_income,
        "monthly_income": base_monthly_income,
        "existing_emi": base_existing_emi,
        "cibil_score": base_cibil,
        "loan_amount": base_amount,
        "credit_utilization": base_utilization,
        "missed_payments": base_missed,
        "employment_type": current_applicant.employment_type if current_applicant else "Salaried",
        "loan_purpose": current_applicant.loan_purpose if current_applicant else "Personal"
    }

    # Potential simulated sample
    sim_cibil = int(sim_data.get("cibil_score", base_cibil))
    sim_loan_amount = float(sim_data.get("loan_amount", base_amount))
    sim_existing_emi = float(sim_data.get("existing_emi", base_existing_emi))
    sim_utilization = float(sim_data.get("credit_utilization", base_utilization))
    sim_missed = int(sim_data.get("missed_payments", base_missed))

    potential_sample = {
        "annual_income": base_annual_income,
        "monthly_income": base_monthly_income,
        "existing_emi": sim_existing_emi,
        "cibil_score": sim_cibil,
        "loan_amount": sim_loan_amount,
        "credit_utilization": sim_utilization,
        "missed_payments": sim_missed,
        "employment_type": current_applicant.employment_type if current_applicant else "Salaried",
        "loan_purpose": current_applicant.loan_purpose if current_applicant else "Personal"
    }

    current_pred = predict_loan(current_sample)
    potential_pred = predict_loan(potential_sample)

    current_dti = round(calculate_dti(base_existing_emi, base_monthly_income) * 100, 1)
    potential_dti = round(calculate_dti(sim_existing_emi, base_monthly_income) * 100, 1)

    diff = round(potential_pred["approval_probability"] - current_pred["approval_probability"], 2)
    if diff > 0:
        message = f"Simulated adjustments increase statistical approval odds by +{diff}%."
    elif diff < 0:
        message = f"Simulated adjustments reduce statistical approval odds by {diff}%."
    else:
        message = "Simulated parameters result in identical credit risk tier."

    return {
        "current": {
            "approval_probability": current_pred["approval_probability"],
            "prediction": current_pred["prediction"],
            "dti": current_dti
        },
        "potential": {
            "approval_probability": potential_pred["approval_probability"],
            "prediction": potential_pred["prediction"],
            "dti": potential_dti
        },
        "delta_probability": diff,
        "message": message
    }
