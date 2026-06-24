from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends

from ..deps import SessionContext, require_permission

router = APIRouter(prefix="/api/research", tags=["research"])

DOCS_DIR = Path(__file__).resolve().parents[2] / ".." / "ai-cardiologist-docs"
ML_MODELS_DIR = Path(__file__).resolve().parents[2] / ".." / "ai-cardiologist-ml" / "models"

MODEL_LABELS: dict[str, str] = {
    "logistic_regression": "Logistic Regression",
    "svm": "Support Vector Machine",
    "decision_tree": "Decision Tree",
    "knn": "k-Nearest Neighbors",
    "random_forest": "Random Forest",
    "xgboost": "XGBoost",
    "neural_network": "Neural Network",
    "naive_bayes": "Naive Bayes",
    "ensemble_voting": "Ensemble (Voting)",
    "anfis": "ANFIS / Fuzzy",
}


def _slim_metrics(full: dict[str, Any]) -> dict[str, Any]:
    models: dict[str, Any] = {}
    for mid, raw in full.get("models", {}).items():
        label = MODEL_LABELS.get(mid, mid)
        if "error" in raw:
            models[mid] = {"label": label, "error": raw["error"]}
            continue
        acc = raw.get("accuracy")
        models[mid] = {
            "label": label,
            "accuracy": acc,
            "test_accuracy": acc,
            "train_accuracy": raw.get("train_accuracy"),
            "precision": raw.get("precision"),
            "recall": raw.get("recall"),
            "f1": raw.get("f1"),
            "roc_auc": raw.get("roc_auc"),
            "brier_score": raw.get("brier_score"),
            "train_test_gap": raw.get("train_test_gap"),
            "cv_roc_auc_mean": raw.get("cv_roc_auc_mean"),
            "cv_roc_auc_std": raw.get("cv_roc_auc_std"),
            "confusion_matrix": raw.get("confusion_matrix"),
        }
    return {
        "defaultModelId": full.get("default_model_id", "ensemble_voting"),
        "test_size": full.get("test_size"),
        "random_state": full.get("random_state"),
        "train_rows": full.get("train_rows"),
        "test_rows": full.get("test_rows"),
        "models": models,
    }


@router.get("/references")
async def list_references(
    session: Annotated[SessionContext, Depends(require_permission("research.read"))],
):
    ref_path = DOCS_DIR / "references.json"
    if not ref_path.exists():
        return {"references": [], "tenantId": session.tenant_id}
    data = json.loads(ref_path.read_text(encoding="utf-8"))
    return {"references": data, "tenantId": session.tenant_id}


@router.get("/metrics")
async def model_metrics(
    session: Annotated[SessionContext, Depends(require_permission("model.read"))],
):
    """Compact leaderboard metrics (JSON-safe, no ROC curve arrays)."""
    summary_path = ML_MODELS_DIR / "leaderboard.json"
    if summary_path.exists():
        data = json.loads(summary_path.read_text(encoding="utf-8"))
        return {**data, "tenantId": session.tenant_id}

    metrics_path = ML_MODELS_DIR / "metrics.json"
    if metrics_path.exists():
        full = json.loads(metrics_path.read_text(encoding="utf-8"))
        return {**_slim_metrics(full), "tenantId": session.tenant_id}

    return {"models": {}, "defaultModelId": "ensemble_voting", "tenantId": session.tenant_id}
