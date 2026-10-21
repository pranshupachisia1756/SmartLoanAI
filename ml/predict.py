from pathlib import Path
import joblib
import pandas as pd
import shap

# Determine project paths dynamically
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = PROJECT_ROOT / "ml"

# Load model and encoders safely
MODEL_PATH = MODEL_DIR / "loan_model.pkl"
EMP_ENC_PATH = MODEL_DIR / "employment_encoder.pkl"
PURP_ENC_PATH = MODEL_DIR / "purpose_encoder.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please run ml/train_model.py first.")

model = joblib.load(MODEL_PATH)
employment_encoder = joblib.load(EMP_ENC_PATH)
purpose_encoder = joblib.load(PURP_ENC_PATH)


def predict_loan(applicant: dict):
    # Create working copy
    app = dict(applicant)

    # -----------------------------
    # Auto-derive missing fields
    # -----------------------------
    annual_income = float(app.get("annual_income", 500000))
    monthly_income = float(app.get("monthly_income") or round(annual_income / 12, 2))
    existing_emi = float(app.get("existing_emi", 0))

    if "debt_to_income" not in app or app["debt_to_income"] is None:
        debt_to_income = round(existing_emi / max(monthly_income, 1), 3)
    else:
        debt_to_income = float(app["debt_to_income"])

    app["monthly_income"] = monthly_income
    app["debt_to_income"] = debt_to_income
    app["age"] = int(app.get("age", 30))
    app["annual_income"] = annual_income
    app["existing_loans"] = int(app.get("existing_loans", 0))
    app["existing_emi"] = existing_emi
    app["loan_amount"] = float(app.get("loan_amount", 200000))
    app["loan_term_months"] = int(app.get("loan_term_months", 36))
    app["cibil_score"] = int(app.get("cibil_score", 700))
    app["credit_utilization"] = float(app.get("credit_utilization", 0.30))
    app["credit_accounts"] = int(app.get("credit_accounts", 2))
    app["missed_payments"] = int(app.get("missed_payments", 0))
    app["employment_years"] = float(app.get("employment_years", 3.0))

    emp_type = str(app.get("employment_type", "Salaried"))
    purpose = str(app.get("loan_purpose", "Personal"))

    # Safely transform categorical values with fallback
    try:
        encoded_emp = employment_encoder.transform([emp_type])[0]
    except Exception:
        encoded_emp = 0

    try:
        encoded_purp = purpose_encoder.transform([purpose])[0]
    except Exception:
        encoded_purp = 0

    feature_dict = {
        "age": app["age"],
        "employment_type": encoded_emp,
        "annual_income": app["annual_income"],
        "existing_loans": app["existing_loans"],
        "existing_emi": app["existing_emi"],
        "loan_amount": app["loan_amount"],
        "loan_term_months": app["loan_term_months"],
        "cibil_score": app["cibil_score"],
        "credit_utilization": app["credit_utilization"],
        "credit_accounts": app["credit_accounts"],
        "missed_payments": app["missed_payments"],
        "employment_years": app["employment_years"],
        "loan_purpose": encoded_purp,
        "monthly_income": app["monthly_income"],
        "debt_to_income": app["debt_to_income"]
    }

    feature_columns = [
        "age",
        "employment_type",
        "annual_income",
        "existing_loans",
        "existing_emi",
        "loan_amount",
        "loan_term_months",
        "cibil_score",
        "credit_utilization",
        "credit_accounts",
        "missed_payments",
        "employment_years",
        "loan_purpose",
        "monthly_income",
        "debt_to_income"
    ]

    data = pd.DataFrame([feature_dict])[feature_columns]

    # -----------------------------
    # Prediction
    # -----------------------------
    probability = float(model.predict_proba(data)[0][1])
    prediction = "APPROVED" if probability >= 0.5 else "REJECTED"

    # -----------------------------
    # SHAP explanation
    # -----------------------------
    shap_result = []
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(data)

        if isinstance(shap_values, list):
            values = shap_values[1][0]
        else:
            values = shap_values[0]

        for feature, val in zip(feature_columns, values):
            shap_result.append({
                "feature": feature,
                "shap_value": round(float(val), 4)
            })

        shap_result.sort(
            key=lambda x: abs(x["shap_value"]),
            reverse=True
        )
    except Exception as e:
        shap_result = [{"feature": "error", "shap_value": 0.0}]

    # -----------------------------
    # Human-readable explanation
    # -----------------------------
    explanations = []

    cibil = app["cibil_score"]
    missed = app["missed_payments"]
    utilization = app["credit_utilization"]
    dti = app["debt_to_income"]
    loan_ratio = app["loan_amount"] / max(app["annual_income"], 1)

    # CIBIL Score
    if cibil >= 750:
        explanations.append({
            "type": "POSITIVE",
            "factor": "CIBIL Score",
            "message": f"Your CIBIL score of {cibil} is strong and supports your application."
        })
    elif cibil >= 700:
        explanations.append({
            "type": "POSITIVE",
            "factor": "CIBIL Score",
            "message": f"Your CIBIL score of {cibil} is good and supports your application."
        })
    elif cibil >= 650:
        explanations.append({
            "type": "WARNING",
            "factor": "CIBIL Score",
            "message": f"Your CIBIL score of {cibil} is moderate. Improving it may strengthen your application."
        })
    else:
        explanations.append({
            "type": "NEGATIVE",
            "factor": "CIBIL Score",
            "message": f"Your CIBIL score of {cibil} is relatively low and may reduce approval chances."
        })

    # Missed payments
    if missed == 0:
        explanations.append({
            "type": "POSITIVE",
            "factor": "Payment History",
            "message": "You have no reported missed payments."
        })
    elif missed <= 2:
        explanations.append({
            "type": "WARNING",
            "factor": "Payment History",
            "message": f"You have {missed} missed payment(s). Maintaining a clean payment history can improve your profile."
        })
    else:
        explanations.append({
            "type": "NEGATIVE",
            "factor": "Payment History",
            "message": f"You have {missed} missed payments, which negatively affects your credit risk assessment."
        })

    # Credit utilization
    utilization_percent = utilization * 100
    if utilization <= 0.30:
        explanations.append({
            "type": "POSITIVE",
            "factor": "Credit Utilization",
            "message": f"Your credit utilization is {utilization_percent:.0f}%, which is within the recommended threshold (<30%)."
        })
    elif utilization <= 0.50:
        explanations.append({
            "type": "WARNING",
            "factor": "Credit Utilization",
            "message": f"Your credit utilization is {utilization_percent:.0f}%. Reducing it below 30% may strengthen your profile."
        })
    else:
        explanations.append({
            "type": "NEGATIVE",
            "factor": "Credit Utilization",
            "message": f"Your credit utilization is {utilization_percent:.0f}%, which indicates high revolving credit reliance."
        })

    # DTI
    dti_percent = dti * 100
    if dti <= 0.30:
        explanations.append({
            "type": "POSITIVE",
            "factor": "Debt-to-Income Ratio",
            "message": f"Your debt-to-income ratio is {dti_percent:.1f}%, indicating manageable existing monthly obligations."
        })
    elif dti <= 0.50:
        explanations.append({
            "type": "WARNING",
            "factor": "Debt-to-Income Ratio",
            "message": f"Your debt-to-income ratio is {dti_percent:.1f}%. Lowering existing EMIs will improve your borrowing capacity."
        })
    else:
        explanations.append({
            "type": "NEGATIVE",
            "factor": "Debt-to-Income Ratio",
            "message": f"Your debt-to-income ratio is {dti_percent:.1f}%, which exceeds conservative risk thresholds."
        })

    # Loan amount ratio
    if loan_ratio <= 0.40:
        explanations.append({
            "type": "POSITIVE",
            "factor": "Loan Amount",
            "message": "The requested loan amount is modest compared with your annual income."
        })
    elif loan_ratio <= 0.70:
        explanations.append({
            "type": "WARNING",
            "factor": "Loan Amount",
            "message": "The requested loan amount is moderate relative to your annual income."
        })
    else:
        explanations.append({
            "type": "NEGATIVE",
            "factor": "Loan Amount",
            "message": "The requested loan amount is high relative to your annual income."
        })

    # -----------------------------
    # Improvement Plan
    # -----------------------------
    improvement_plan = []

    if cibil < 700:
        improvement_plan.append({
            "factor": "CIBIL Score",
            "current_value": str(cibil),
            "target": "700+",
            "action": "Ensure all bills and credit installments are paid on time, and dispute any credit bureau report inaccuracies."
        })

    if utilization > 0.30:
        improvement_plan.append({
            "factor": "Credit Utilization",
            "current_value": f"{utilization_percent:.0f}%",
            "target": "Below 30%",
            "action": "Pay down existing credit card balances before submitting an application."
        })

    if dti > 0.40:
        improvement_plan.append({
            "factor": "Debt-to-Income Ratio",
            "current_value": f"{dti_percent:.1f}%",
            "target": "Below 40%",
            "action": "Close smaller existing debts or opt for a longer tenure to reduce monthly EMI strain."
        })

    if missed > 0:
        improvement_plan.append({
            "factor": "Missed Payments",
            "current_value": str(missed),
            "target": "0",
            "action": "Set up auto-debit (NACH) for all recurring EMIs to maintain a 100% on-time track record."
        })

    if loan_ratio > 0.70:
        suggested_amount = int(app["annual_income"] * 0.65)
        improvement_plan.append({
            "factor": "Loan Amount",
            "current_value": f"Rs. {app['loan_amount']:,.0f}",
            "target": f"Around Rs. {suggested_amount:,.0f} or lower",
            "action": "Consider applying for a lower loan amount or adding a co-applicant to increase eligible income."
        })

    if len(improvement_plan) == 0:
        improvement_plan.append({
            "factor": "Overall Profile",
            "current_value": "Strong",
            "target": "Maintain current profile",
            "action": "Continue maintaining timely payments, low credit utilization, and manageable debt obligations."
        })

    # -----------------------------
    # Final result
    # -----------------------------
    return {
        "prediction": prediction,
        "approval_probability": round(float(probability * 100), 2),
        "explanations": explanations,
        "improvement_plan": improvement_plan,
        "shap_values": shap_result[:5],
        "disclaimer": "This prediction is an AI-powered statistical estimation based on synthetic training data. It is not an official guarantee of bank loan approval or sanction."
    }


if __name__ == "__main__":
    sample_applicant = {
        "age": 28,
        "employment_type": "Self Employed",
        "annual_income": 600000,
        "existing_loans": 3,
        "existing_emi": 28000,
        "loan_amount": 1500000,
        "loan_term_months": 60,
        "cibil_score": 620,
        "credit_utilization": 0.75,
        "credit_accounts": 4,
        "missed_payments": 3,
        "employment_years": 2,
        "loan_purpose": "Personal"
    }

    result = predict_loan(sample_applicant)

    print("\n========== SMARTLOAN AI PREDICTION ==========")
    print("Prediction:", result["prediction"])
    print("Approval Probability:", result["approval_probability"], "%")

    print("\n========== TOP SHAP FACTORS ==========")
    for s in result["shap_values"]:
        print(f"  {s['feature']}: {s['shap_value']}")

    print("\n========== EXPLANATIONS ==========")
    for item in result["explanations"]:
        print(f"  [{item['type']}] {item['factor']}: {item['message']}")

    print("\n========== IMPROVEMENT PLAN ==========")
    for i, item in enumerate(result["improvement_plan"], 1):
        print(f"  {i}. {item['factor']} (Target: {item['target']}) -> {item['action']}")