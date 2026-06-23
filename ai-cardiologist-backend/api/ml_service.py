"""Load joblib models from ML pipeline exports."""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

MODELS_DIR = Path(os.getenv("MODELS_DIR", "../ai-cardiologist-ml/models/artifacts"))

FEATURE_COLUMNS = [
    "HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke", "Diabetes",
    "PhysActivity", "Fruits", "Veggies", "HvyAlcoholConsump", "AnyHealthcare",
    "NoDocbcCost", "GenHlth", "MentHlth", "PhysHlth", "DiffWalk", "Sex", "Age",
    "Education", "Income",
]

DEFAULT_MODEL_ID = "ensemble_voting"


@lru_cache(maxsize=16)
def load_model(model_id: str):
    path = MODELS_DIR / f"{model_id}.joblib"
    if not path.exists():
        raise FileNotFoundError(f"Model artifact not found: {path}")
    return joblib.load(path)


def list_available_models() -> list[str]:
    registry = MODELS_DIR / "registry.json"
    if registry.exists():
        data = json.loads(registry.read_text(encoding="utf-8"))
        return data.get("models", [])
    return [p.stem for p in MODELS_DIR.glob("*.joblib")]


def predict_single(model_id: str, features: dict[str, Any]) -> dict[str, Any]:
    row = {k: features[k] for k in FEATURE_COLUMNS}
    df = pd.DataFrame([row])
    model = load_model(model_id)
    proba = float(model.predict_proba(df)[0, 1])
    pred = int(model.predict(df)[0])
    explanation = _local_explanation(model, df, proba, pred)
    return {
        "modelId": model_id,
        "prediction": pred,
        "probability": proba,
        "riskLabel": "elevated" if proba >= 0.5 else "lower",
        "explanation": explanation,
    }


def _local_explanation(model, df: pd.DataFrame, proba: float, pred: int) -> dict:
    contributions = []
    try:
        clf = model.named_steps.get("clf") if hasattr(model, "named_steps") else model
        if hasattr(clf, "coef_"):
            for name, coef in zip(FEATURE_COLUMNS, clf.coef_.ravel()):
                val = float(df[name].iloc[0])
                contributions.append({"feature": name, "contribution": float(coef * val)})
        elif hasattr(clf, "feature_importances_"):
            for name, imp in zip(FEATURE_COLUMNS, clf.feature_importances_):
                val = float(df[name].iloc[0])
                contributions.append({"feature": name, "contribution": float(imp * val)})
    except Exception:
        pass
    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return {
        "probability": proba,
        "prediction": pred,
        "topContributions": contributions[:10],
    }


def predict_batch(model_id: str, rows: list[dict]) -> dict[str, Any]:
    df = pd.DataFrame(rows)
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing feature column: {col}")
    model = load_model(model_id)
    proba = model.predict_proba(df[FEATURE_COLUMNS])[:, 1]
    preds = model.predict(df[FEATURE_COLUMNS])
    results = []
    for i in range(len(df)):
        results.append({"prediction": int(preds[i]), "probability": float(proba[i])})
    metrics = None
    if "HeartDiseaseorAttack" in df.columns:
        from sklearn.metrics import accuracy_score, roc_auc_score

        y_true = df["HeartDiseaseorAttack"]
        metrics = {
            "accuracy": float(accuracy_score(y_true, preds)),
            "roc_auc": float(roc_auc_score(y_true, proba)),
            "rows": len(df),
        }
    return {"results": results, "metrics": metrics, "modelId": model_id}
