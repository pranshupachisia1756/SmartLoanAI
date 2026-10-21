from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from xgboost import XGBClassifier


# Define project paths dynamically
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "dataset" / "loan_data.csv"
MODEL_DIR = PROJECT_ROOT / "ml"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


# =========================
# 1. Load dataset
# =========================

print(f"Loading dataset from: {DATASET_PATH}")
if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset file not found at {DATASET_PATH}. Please run dataset/generate_dataset.py first.")

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)
print("Note: This dataset contains synthetic applicant records designed for college academic evaluation.")


# =========================
# 2. Encode categorical data
# =========================

employment_encoder = LabelEncoder()
purpose_encoder = LabelEncoder()

df["employment_type"] = employment_encoder.fit_transform(
    df["employment_type"]
)

df["loan_purpose"] = purpose_encoder.fit_transform(
    df["loan_purpose"]
)


# =========================
# 3. Separate features and target
# =========================

X = df.drop("loan_status", axis=1)
y = df["loan_status"]


# =========================
# 4. Train-test split
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


print("Training samples:", len(X_train))
print("Testing samples :", len(X_test))


# =========================
# 5. Create XGBoost model
# =========================

model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric="logloss"
)


# =========================
# 6. Train model
# =========================

print("\nTraining XGBoost model...")

model.fit(X_train, y_train)

print("Training completed!")


# =========================
# 7. Predictions
# =========================

y_pred = model.predict(X_test)
y_probability = model.predict_proba(X_test)[:, 1]


# =========================
# 8. Evaluation
# =========================

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_probability)


print("\n========== MODEL EVALUATION RESULTS ==========")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC-AUC   : {roc_auc:.4f}")
print("===============================================")


# =========================
# 9. Save model and encoders
# =========================

model_path = MODEL_DIR / "loan_model.pkl"
emp_enc_path = MODEL_DIR / "employment_encoder.pkl"
purp_enc_path = MODEL_DIR / "purpose_encoder.pkl"

joblib.dump(model, model_path)
joblib.dump(employment_encoder, emp_enc_path)
joblib.dump(purpose_encoder, purp_enc_path)

print(f"\nModel and encoders saved successfully into: {MODEL_DIR}")
print(f"1. {model_path.name}")
print(f"2. {emp_enc_path.name}")
print(f"3. {purp_enc_path.name}")