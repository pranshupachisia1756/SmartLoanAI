import pandas as pd
import numpy as np

np.random.seed(42)

N = 5000

data = pd.DataFrame({
    "age": np.random.randint(21, 61, N),

    "employment_type": np.random.choice(
        ["Salaried", "Self Employed", "Business Owner"],
        N
    ),

    "annual_income": np.random.randint(200000, 2500000, N),

    "existing_loans": np.random.randint(0, 4, N),

    "existing_emi": np.random.randint(0, 50000, N),

    "loan_amount": np.random.randint(100000, 3000000, N),

    "loan_term_months": np.random.choice(
        [12, 24, 36, 48, 60, 84],
        N
    ),

    "cibil_score": np.random.randint(550, 851, N),

    "credit_utilization": np.round(
        np.random.uniform(0.05, 0.95, N), 2
    ),

    "credit_accounts": np.random.randint(1, 12, N),

    "missed_payments": np.random.randint(0, 6, N),

    "employment_years": np.round(
        np.random.uniform(0, 20, N), 1
    ),

    "loan_purpose": np.random.choice(
        ["Home", "Education", "Medical", "Vehicle", "Personal", "Business"],
        N
    )
})


# Calculate approximate debt-to-income ratio
data["monthly_income"] = (
    data["annual_income"] / 12
).round(2)

data["debt_to_income"] = (
    data["existing_emi"] / data["monthly_income"]
).round(3)


# Create a risk score for generating the target
risk_score = (
    (750 - data["cibil_score"]) * 0.015
    + data["credit_utilization"] * 2
    + data["missed_payments"] * 0.8
    + data["existing_loans"] * 0.5
    + data["debt_to_income"] * 3
    - data["employment_years"] * 0.05
    + (data["loan_amount"] / data["annual_income"]) * 2
)


# Add some randomness
risk_score += np.random.normal(0, 0.8, N)


# Generate approval target
data["loan_status"] = np.where(
    risk_score < 5.5,
    1,
    0
)


# Save dataset
data.to_csv("dataset/loan_data.csv", index=False)

print("Dataset created successfully!")
print(f"Total records: {len(data)}")
print("\nColumns:")
print(data.columns.tolist())
print("\nLoan status distribution:")
print(data["loan_status"].value_counts())