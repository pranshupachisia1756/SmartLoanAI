from pathlib import Path
import pandas as pd
import numpy as np

# Dynamic path resolution to prevent CWD path failures
DATASET_DIR = Path(__file__).resolve().parent
DATASET_PATH = DATASET_DIR / "loan_data.csv"

np.random.seed(42)

N = 5000

# Realistic Indian retail credit applicant distributions
ages = np.random.randint(21, 62, N)
employment_types = np.random.choice(["Salaried", "Self Employed", "Business Owner"], N, p=[0.60, 0.25, 0.15])
annual_incomes = np.random.choice([
    np.random.randint(250000, 600000),    # Entry/Junior
    np.random.randint(600000, 1500000),   # Mid-level
    np.random.randint(1500000, 3500000)   # Senior/High income
], N, p=[0.40, 0.45, 0.15])

existing_loans = np.random.choice([0, 1, 2, 3, 4], N, p=[0.35, 0.35, 0.18, 0.08, 0.04])
existing_emis = []
for el in existing_loans:
    if el == 0:
        existing_emis.append(0)
    else:
        existing_emis.append(int(el * np.random.randint(3000, 15000)))
existing_emis = np.array(existing_emis)

loan_amounts = np.random.choice([
    np.random.randint(50000, 300000),
    np.random.randint(300000, 1000000),
    np.random.randint(1000000, 3000000)
], N, p=[0.30, 0.50, 0.20])

loan_terms = np.random.choice([12, 24, 36, 48, 60, 84], N, p=[0.10, 0.20, 0.35, 0.15, 0.15, 0.05])
cibil_scores = np.random.randint(550, 851, N)
credit_utilizations = np.round(np.random.uniform(0.05, 0.90, N), 2)
credit_accounts = np.random.randint(1, 10, N)
missed_payments = np.random.choice([0, 1, 2, 3, 4], N, p=[0.65, 0.20, 0.08, 0.05, 0.02])
employment_years = np.round(np.random.uniform(0.5, 20.0, N), 1)
loan_purposes = np.random.choice(
    ["Personal", "Home", "Education", "Medical", "Vehicle", "Business"],
    N,
    p=[0.30, 0.25, 0.15, 0.10, 0.10, 0.10]
)

data = pd.DataFrame({
    "age": ages,
    "employment_type": employment_types,
    "annual_income": annual_incomes,
    "existing_loans": existing_loans,
    "existing_emi": existing_emis,
    "loan_amount": loan_amounts,
    "loan_term_months": loan_terms,
    "cibil_score": cibil_scores,
    "credit_utilization": credit_utilizations,
    "credit_accounts": credit_accounts,
    "missed_payments": missed_payments,
    "employment_years": employment_years,
    "loan_purpose": loan_purposes
})

# Calculate approximate debt-to-income ratio
data["monthly_income"] = (data["annual_income"] / 12).round(2)
data["debt_to_income"] = (data["existing_emi"] / data["monthly_income"]).round(3)

# Calibrated retail credit risk formula
loan_to_income = data["loan_amount"] / data["annual_income"]
risk_score = (
    (750 - data["cibil_score"]) * 0.025
    + data["credit_utilization"] * 2.5
    + data["missed_payments"] * 1.5
    + data["existing_loans"] * 0.4
    + data["debt_to_income"] * 3.5
    + loan_to_income * 1.5
    - (data["employment_years"] * 0.04)
)

# Mild noise to simulate real-world variance
risk_score += np.random.normal(0, 0.6, N)

# Binary target: 1 = Approved, 0 = Rejected
data["loan_status"] = np.where(risk_score < 4.2, 1, 0)

# Save dataset with absolute path
data.to_csv(DATASET_PATH, index=False)

print("Dataset created successfully!")
print(f"Target location: {DATASET_PATH}")
print(f"Total records: {len(data)}")
print("\nLoan status distribution:")
print(data["loan_status"].value_counts(normalize=True).round(3))