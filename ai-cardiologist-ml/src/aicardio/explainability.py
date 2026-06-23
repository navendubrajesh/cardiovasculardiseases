"""ELI5 / SHAP explainability (AC-040, AC-041, AC-042)."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .constants import FEATURE_COLUMNS


def global_feature_importance(model, x_sample: pd.DataFrame) -> list[dict[str, Any]]:
    """Global importance via ELI5 or model-native coefficients."""
    try:
        import eli5
        from eli5.sklearn import PermutationImportance

        perm = PermutationImportance(model, n_iter=5, random_state=42).fit(x_sample, model.predict(x_sample))
        weights = eli5.explain_weights(model, feature_names=FEATURE_COLUMNS)
        # Parse top features from ELI5 explanation object when possible
        importances = []
        clf = model.named_steps.get("clf") if hasattr(model, "named_steps") else model
        if hasattr(clf, "feature_importances_"):
            prep = model.named_steps["prep"]
            # fallback to tree importances on transformed space — use permutation
            for i, name in enumerate(FEATURE_COLUMNS[: len(clf.feature_importances_)]):
                importances.append({"feature": name, "weight": float(clf.feature_importances_[i])})
        elif hasattr(clf, "coef_"):
            coef = clf.coef_.ravel()
            for name, w in zip(FEATURE_COLUMNS, coef):
                importances.append({"feature": name, "weight": float(w)})
        else:
            for i, name in enumerate(FEATURE_COLUMNS):
                importances.append({"feature": name, "weight": float(getattr(perm, "feature_importances_", [0] * len(FEATURE_COLUMNS))[i])})
        importances.sort(key=lambda r: abs(r["weight"]), reverse=True)
        return importances[:15]
    except Exception:
        return _fallback_importance(model)


def _fallback_importance(model) -> list[dict[str, Any]]:
    clf = model.named_steps.get("clf") if hasattr(model, "named_steps") else model
    if hasattr(clf, "feature_importances_"):
        vals = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        vals = np.abs(clf.coef_.ravel())
    else:
        return [{"feature": f, "weight": 0.0} for f in FEATURE_COLUMNS]
    pairs = [{"feature": f, "weight": float(w)} for f, w in zip(FEATURE_COLUMNS, vals)]
    pairs.sort(key=lambda r: abs(r["weight"]), reverse=True)
    return pairs


def local_explanation(model, row: pd.DataFrame) -> dict[str, Any]:
    """Instance-level contribution breakdown."""
    proba = float(model.predict_proba(row)[0, 1])
    pred = int(model.predict(row)[0])
    contributions = []
    try:
        import eli5

        exp = eli5.explain_prediction(model, row.iloc[0].values, feature_names=FEATURE_COLUMNS)
        for feat in exp.feature_weights.pos + exp.feature_weights.neg:
            contributions.append({"feature": str(feat.feature), "contribution": float(feat.value)})
    except Exception:
        global_imp = global_feature_importance(model, row)
        for item in global_imp[:10]:
            val = float(row[item["feature"]].iloc[0]) if item["feature"] in row.columns else 0
            contributions.append(
                {"feature": item["feature"], "contribution": item["weight"] * val}
            )

    return {
        "prediction": pred,
        "probability": proba,
        "risk_label": "elevated" if proba >= 0.5 else "lower",
        "contributions": contributions,
    }


def shap_summary_values(model, x_sample: pd.DataFrame, max_rows: int = 200) -> dict[str, Any]:
    """Optional SHAP for tree ensembles (AC-042)."""
    try:
        import shap

        sample = x_sample.head(max_rows)
        clf = model.named_steps["clf"] if hasattr(model, "named_steps") else model
        if not hasattr(clf, "predict_proba"):
            return {"available": False, "reason": "Model does not support SHAP tree explainer"}
        explainer = shap.Explainer(clf, model.named_steps["prep"].transform(sample))
        shap_values = explainer(model.named_steps["prep"].transform(sample))
        mean_abs = np.abs(shap_values.values).mean(axis=0).tolist()
        return {
            "available": True,
            "mean_abs_shap": [
                {"feature": f, "shap": float(v)}
                for f, v in zip(FEATURE_COLUMNS, mean_abs[: len(FEATURE_COLUMNS)])
            ],
        }
    except Exception as exc:
        return {"available": False, "reason": str(exc)}
