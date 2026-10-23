from pathlib import Path
import pandas as pd
import numpy as np

DATASET_DIR = Path(__file__).resolve().parent

# ==============================================================================
# 1. GENERATE INSTITUTIONAL BANK LOAN SCHEMES DATASET
# ==============================================================================

bank_schemes = [
    {
        "bank_name": "State Bank of India",
        "short_name": "SBI",
        "bank_type": "Public Lender",
        "product_name": "SBI Xpress Credit Personal Loan",
        "interest_rate_min": 10.50,
        "interest_rate_max": 14.50,
        "min_loan_amount": 25000,
        "max_loan_amount": 2000000,
        "min_cibil_score": 650,
        "min_annual_income": 200000,
        "processing_fee_pct": 1.00,
        "max_tenure_months": 72,
        "approval_turnaround": "3 to 7 working days",
        "prepayment_penalty": "Nil after 12 months",
        "official_url": "https://sbi.co.in"
    },
    {
        "bank_name": "HDFC Bank",
        "short_name": "HDFC",
        "bank_type": "Private Lender",
        "product_name": "HDFC Quick Cash Personal Loan",
        "interest_rate_min": 10.75,
        "interest_rate_max": 16.00,
        "min_loan_amount": 50000,
        "max_loan_amount": 4000000,
        "min_cibil_score": 680,
        "min_annual_income": 300000,
        "processing_fee_pct": 1.25,
        "max_tenure_months": 60,
        "approval_turnaround": "Instant to 48 hours",
        "prepayment_penalty": "2% to 4%",
        "official_url": "https://www.hdfcbank.com"
    },
    {
        "bank_name": "ICICI Bank",
        "short_name": "ICICI",
        "bank_type": "Private Lender",
        "product_name": "ICICI Dream Loan Solution",
        "interest_rate_min": 10.85,
        "interest_rate_max": 16.50,
        "min_loan_amount": 50000,
        "max_loan_amount": 5000000,
        "min_cibil_score": 700,
        "min_annual_income": 250000,
        "processing_fee_pct": 1.50,
        "max_tenure_months": 72,
        "approval_turnaround": "24 to 72 hours",
        "prepayment_penalty": "3% + GST",
        "official_url": "https://www.icicibank.com"
    },
    {
        "bank_name": "Axis Bank",
        "short_name": "Axis",
        "bank_type": "Private Lender",
        "product_name": "Axis Bank 24x7 Personal Loan",
        "interest_rate_min": 10.99,
        "interest_rate_max": 16.75,
        "min_loan_amount": 50000,
        "max_loan_amount": 4000000,
        "min_cibil_score": 670,
        "min_annual_income": 240000,
        "processing_fee_pct": 1.50,
        "max_tenure_months": 60,
        "approval_turnaround": "2 to 4 working days",
        "prepayment_penalty": "2%",
        "official_url": "https://www.axisbank.com"
    },
    {
        "bank_name": "Bank of Baroda",
        "short_name": "BoB",
        "bank_type": "Public Lender",
        "product_name": "Baroda Advantage Personal Loan",
        "interest_rate_min": 10.35,
        "interest_rate_max": 14.80,
        "min_loan_amount": 50000,
        "max_loan_amount": 2000000,
        "min_cibil_score": 650,
        "min_annual_income": 200000,
        "processing_fee_pct": 1.00,
        "max_tenure_months": 60,
        "approval_turnaround": "2 to 4 working days",
        "prepayment_penalty": "Nil",
        "official_url": "https://www.bankofbaroda.in"
    },
    {
        "bank_name": "Kotak Mahindra Bank",
        "short_name": "Kotak",
        "bank_type": "Private Lender",
        "product_name": "Kotak Instant Personal Loan",
        "interest_rate_min": 10.99,
        "interest_rate_max": 17.50,
        "min_loan_amount": 50000,
        "max_loan_amount": 4000000,
        "min_cibil_score": 680,
        "min_annual_income": 300000,
        "processing_fee_pct": 1.50,
        "max_tenure_months": 60,
        "approval_turnaround": "Instant to 24 hours",
        "prepayment_penalty": "3%",
        "official_url": "https://www.kotak.com"
    },
    {
        "bank_name": "Punjab National Bank",
        "short_name": "PNB",
        "bank_type": "Public Lender",
        "product_name": "PNB Sahyog Personal Loan",
        "interest_rate_min": 10.40,
        "interest_rate_max": 15.25,
        "min_loan_amount": 25000,
        "max_loan_amount": 2000000,
        "min_cibil_score": 660,
        "min_annual_income": 180000,
        "processing_fee_pct": 1.00,
        "max_tenure_months": 72,
        "approval_turnaround": "3 to 5 working days",
        "prepayment_penalty": "Nil",
        "official_url": "https://www.pnbindia.in"
    },
    {
        "bank_name": "Canara Bank",
        "short_name": "Canara",
        "bank_type": "Public Lender",
        "product_name": "Canara Budget Personal Loan",
        "interest_rate_min": 10.65,
        "interest_rate_max": 15.10,
        "min_loan_amount": 25000,
        "max_loan_amount": 1500000,
        "min_cibil_score": 650,
        "min_annual_income": 180000,
        "processing_fee_pct": 0.75,
        "max_tenure_months": 60,
        "approval_turnaround": "3 to 5 working days",
        "prepayment_penalty": "Nil",
        "official_url": "https://canarabank.com"
    },
    {
        "bank_name": "IndusInd Bank",
        "short_name": "IndusInd",
        "bank_type": "Private Lender",
        "product_name": "IndusInd Multi-Purpose Personal Loan",
        "interest_rate_min": 10.49,
        "interest_rate_max": 17.00,
        "min_loan_amount": 50000,
        "max_loan_amount": 3000000,
        "min_cibil_score": 675,
        "min_annual_income": 300000,
        "processing_fee_pct": 1.50,
        "max_tenure_months": 60,
        "approval_turnaround": "24 to 48 hours",
        "prepayment_penalty": "2.5%",
        "official_url": "https://www.indusind.com"
    },
    {
        "bank_name": "IDFC FIRST Bank",
        "short_name": "IDFC",
        "bank_type": "Private Lender",
        "product_name": "IDFC FIRST Easy Personal Loan",
        "interest_rate_min": 10.49,
        "interest_rate_max": 18.00,
        "min_loan_amount": 50000,
        "max_loan_amount": 5000000,
        "min_cibil_score": 680,
        "min_annual_income": 240000,
        "processing_fee_pct": 1.75,
        "max_tenure_months": 60,
        "approval_turnaround": "4 to 24 hours",
        "prepayment_penalty": "Nil after 3 EMIs",
        "official_url": "https://www.idfcfirstbank.com"
    }
]

df_schemes = pd.DataFrame(bank_schemes)
schemes_csv = DATASET_DIR / "bank_loan_schemes.csv"
df_schemes.to_csv(schemes_csv, index=False)
print(f"Generated institutional bank schemes dataset: {schemes_csv} ({len(df_schemes)} banks)")


# ==============================================================================
# 2. GENERATE MULTI-BANK LOAN OFFERS BENCHMARK DATASET (5,000 RECORDS)
# ==============================================================================

np.random.seed(42)
N = 5000

applicant_ids = [f"APP-{100000 + i}" for i in range(N)]
ages = np.random.randint(22, 60, N)
employment_types = np.random.choice(["Salaried", "Self Employed", "Business Owner"], N, p=[0.65, 0.23, 0.12])
annual_incomes = np.random.choice([
    np.random.randint(280000, 500000),
    np.random.randint(500000, 1200000),
    np.random.randint(1200000, 3000000)
], N, p=[0.35, 0.45, 0.20])

monthly_incomes = np.round(annual_incomes / 12.0, 2)
cibil_scores = np.random.randint(580, 850, N)
existing_emis = np.random.choice([0, 5000, 10000, 18000, 30000], N, p=[0.40, 0.25, 0.20, 0.10, 0.05])
dtis = np.round(existing_emis / np.maximum(monthly_incomes, 1), 3)

requested_amounts = np.random.choice([
    100000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000
], N, p=[0.10, 0.15, 0.25, 0.25, 0.10, 0.08, 0.05, 0.02])

tenures = np.random.choice([12, 24, 36, 48, 60], N, p=[0.10, 0.20, 0.40, 0.15, 0.15])


def calc_emi(amount, rate_pa, tenure_m):
    if amount <= 0 or tenure_m <= 0:
        return 0
    r = (rate_pa / 12.0) / 100.0
    return round((amount * r * ((1 + r) ** tenure_m)) / (((1 + r) ** tenure_m) - 1))


records = []

for i in range(N):
    inc = annual_incomes[i]
    m_inc = monthly_incomes[i]
    cibil = cibil_scores[i]
    dti = dtis[i]
    req_amt = requested_amounts[i]
    tenure = tenures[i]

    row = {
        "applicant_id": applicant_ids[i],
        "age": ages[i],
        "employment_type": employment_types[i],
        "annual_income": inc,
        "monthly_income": m_inc,
        "cibil_score": cibil,
        "existing_emi": existing_emis[i],
        "debt_to_income": dti,
        "requested_amount": req_amt,
        "tenure_months": tenure
    }

    best_match_name = None
    best_rate = 99.0
    best_offered = 0

    for scheme in bank_schemes:
        short = scheme["short_name"].lower()
        min_c = scheme["min_cibil_score"]
        min_inc = scheme["min_annual_income"]
        max_limit = scheme["max_loan_amount"]
        min_limit = scheme["min_loan_amount"]
        base_rate = scheme["interest_rate_min"]

        # Eligibility criteria
        is_eligible = (cibil >= min_c) and (inc >= min_inc) and (dti <= 0.55)

        if is_eligible:
            cibil_mult = 1.05 if cibil >= 780 else (1.0 if cibil >= 740 else 0.85)
            dti_mult = max(0.40, 1.0 - (dti * 0.75))
            bank_mult = 24.0 if scheme["bank_type"] == "Private Lender" else 20.0

            raw_offer = m_inc * bank_mult * cibil_mult * dti_mult
            offered_amt = int(min(max_limit, max(min_limit, round(raw_offer / 10000.0) * 10000.0)))

            # Adjust interest rate based on risk
            rate = base_rate + (0.0 if cibil >= 780 else (0.50 if cibil >= 730 else 1.25))
            emi = calc_emi(min(offered_amt, req_amt), rate, tenure)
            status = "Eligible"

            if rate < best_rate:
                best_rate = rate
                best_match_name = scheme["bank_name"]
                best_offered = offered_amt
        else:
            offered_amt = 0
            rate = 0.0
            emi = 0
            status = "Ineligible (Score/DTI Cutoff)"

        row[f"{short}_status"] = status
        row[f"{short}_offered_loan_amount"] = offered_amt
        row[f"{short}_interest_rate"] = rate
        row[f"{short}_monthly_emi"] = emi

    row["best_matched_bank"] = best_match_name or "None (Needs Improvement)"
    row["best_offered_amount"] = best_offered
    row["best_interest_rate"] = best_rate if best_rate < 99.0 else 0.0

    records.append(row)

df_offers = pd.DataFrame(records)
offers_csv = DATASET_DIR / "multi_bank_loan_offers.csv"
df_offers.to_csv(offers_csv, index=False)
print(f"Generated multi-bank loan offers dataset: {offers_csv} ({len(df_offers)} applicant evaluations)")
