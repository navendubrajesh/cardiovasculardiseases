"""Training, evaluation, CV (AC-030, AC-031, AC-032)."""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

from .constants import DEFAULT_MODEL_ID, MODEL_IDS
from .models import build_model

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


def sanitize_for_json(obj: Any) -> Any:
    """Replace NaN/Inf so FastAPI and browsers can serialize metrics safely."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, (np.floating, np.integer)):
        return sanitize_for_json(float(obj))
    return obj


def stratified_train_test_split(x, y, test_size=0.3, random_state=42):
    return train_test_split(x, y, test_size=test_size, stratify=y, random_state=random_state)


def evaluate_model(model, x_test, y_test) -> dict[str, Any]:
    y_pred = model.predict(x_test)
    y_proba = (
        model.predict_proba(x_test)[:, 1]
        if hasattr(model, "predict_proba")
        else y_pred.astype(float)
    )

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_proba)) if len(np.unique(y_test)) > 1 else 0.0,
        "brier_score": float(brier_score_loss(y_test, y_proba)),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }

    fpr, tpr, thresholds = roc_curve(y_test, y_proba)
    metrics["roc_curve"] = sanitize_for_json(
        {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
            "thresholds": thresholds.tolist(),
        }
    )

    prob_true, prob_pred = calibration_curve(y_test, y_proba, n_bins=10, strategy="quantile")
    metrics["calibration"] = {
        "prob_true": prob_true.tolist(),
        "prob_pred": prob_pred.tolist(),
    }
    return metrics


def cross_validate_model(model, x, y, n_splits=5, random_state=42) -> dict[str, float]:
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    scores = cross_val_score(model, x, y, cv=cv, scoring="roc_auc", n_jobs=-1)
    return {
        "cv_roc_auc_mean": float(scores.mean()),
        "cv_roc_auc_std": float(scores.std()),
        "cv_roc_auc_ci_low": float(np.percentile(scores, 2.5)),
        "cv_roc_auc_ci_high": float(np.percentile(scores, 97.5)),
    }


def train_all_models(
    x: pd.DataFrame,
    y: pd.Series,
    *,
    test_size: float = 0.3,
    random_state: int = 42,
    model_ids: list[str] | None = None,
) -> dict[str, Any]:
    model_ids = model_ids or MODEL_IDS
    x_train, x_test, y_train, y_test = stratified_train_test_split(
        x, y, test_size=test_size, random_state=random_state
    )

    leaderboard: dict[str, Any] = {
        "default_model_id": DEFAULT_MODEL_ID,
        "test_size": test_size,
        "random_state": random_state,
        "train_rows": len(x_train),
        "test_rows": len(x_test),
        "models": {},
    }

    for mid in model_ids:
        try:
            model = build_model(mid)
            model.fit(x_train, y_train)
            train_acc = float(accuracy_score(y_train, model.predict(x_train)))
            test_metrics = evaluate_model(model, x_test, y_test)
            cv_metrics = cross_validate_model(model, x_train, y_train)
            leaderboard["models"][mid] = {
                "train_accuracy": train_acc,
                **test_metrics,
                **cv_metrics,
                "train_test_gap": train_acc - test_metrics["accuracy"],
            }
        except Exception as exc:  # noqa: BLE001 — collect per-model failures
            leaderboard["models"][mid] = {"error": str(exc)}

    return leaderboard


def leaderboard_summary(leaderboard: dict[str, Any]) -> dict[str, Any]:
    """Compact metrics for API / Models page (no ROC curves or calibration arrays)."""
    models: dict[str, Any] = {}
    for mid, raw in leaderboard.get("models", {}).items():
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
    return sanitize_for_json(
        {
            "defaultModelId": leaderboard.get("default_model_id", DEFAULT_MODEL_ID),
            "test_size": leaderboard.get("test_size"),
            "random_state": leaderboard.get("random_state"),
            "train_rows": leaderboard.get("train_rows"),
            "test_rows": leaderboard.get("test_rows"),
            "models": models,
        }
    )


def save_leaderboard(leaderboard: dict, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    clean = sanitize_for_json(leaderboard)
    path.write_text(json.dumps(clean, indent=2), encoding="utf-8")
    summary_path = path.parent / "leaderboard.json"
    summary_path.write_text(json.dumps(leaderboard_summary(leaderboard), indent=2), encoding="utf-8")
