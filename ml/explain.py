from pathlib import Path
import pandas as pd
import joblib
import shap


# =========================
# 1. Load model and encoders
# =========================

def explain_sample(sample_idx=0):
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    MODEL_DIR = PROJECT_ROOT / "ml"
    DATASET_PATH = PROJECT_ROOT / "dataset" / "loan_data.csv"

    model = joblib.load(MODEL_DIR / "loan_model.pkl")
    employment_encoder = joblib.load(MODEL_DIR / "employment_encoder.pkl")
    purpose_encoder = joblib.load(MODEL_DIR / "purpose_encoder.pkl")

    df = pd.read_csv(DATASET_PATH)
    df["employment_type"] = employment_encoder.transform(df["employment_type"])
    df["loan_purpose"] = purpose_encoder.transform(df["loan_purpose"])
    X = df.drop("loan_status", axis=1)

    sample = X.iloc[[sample_idx]]
    prediction = model.predict(sample)[0]
    probability = model.predict_proba(sample)[0][1]

    print("\n========== AI LOAN DECISION ESTIMATE ==========")
    if prediction == 1:
        print("Prediction: APPROVED (Estimated)")
    else:
        print("Prediction: REJECTED (Estimated)")

    print(f"Estimated Approval Probability: {probability * 100:.2f}%")
    print("Disclaimer: This estimate is based on synthetic training data.")

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(sample)
    if isinstance(shap_values, list):
        s_vals = shap_values[1][0]
    else:
        s_vals = shap_values[0]

    print("\n========== SHAP FEATURE IMPORTANCE ==========")
    explanations = []
    for feature, value in zip(X.columns, s_vals):
        if value > 0:
            direction = "increased approval prediction"
        else:
            direction = "decreased approval prediction"
        explanations.append((feature, value, direction))

    explanations.sort(key=lambda x: abs(x[1]), reverse=True)
    for feature, value, direction in explanations:
        print(f"{feature:20s}: {value:+.4f} -> {direction}")

    print("\n========== TOP 5 INFLUENTIAL FACTORS ==========")
    for feature, value, direction in explanations[:5]:
        print(f"- {feature}: {direction}")


if __name__ == "__main__":
    explain_sample()