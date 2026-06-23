"""Classifier factories — AC-020 through AC-028."""
from __future__ import annotations

from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

try:
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover
    XGBClassifier = None  # type: ignore[misc, assignment]

from .constants import MODEL_IDS
from .preprocessing import build_preprocessor


def _wrap(estimator) -> Pipeline:
    return Pipeline([("prep", build_preprocessor()), ("clf", estimator)])


def build_model(model_id: str):
    if model_id not in MODEL_IDS:
        raise ValueError(f"Unknown model_id: {model_id}. Valid: {MODEL_IDS}")

    if model_id == "logistic_regression":
        return _wrap(
            LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
        )
    if model_id == "svm":
        return _wrap(SVC(kernel="rbf", probability=True, class_weight="balanced", random_state=42))
    if model_id == "decision_tree":
        return _wrap(
            DecisionTreeClassifier(
                max_depth=12,
                min_samples_leaf=50,
                class_weight="balanced",
                random_state=42,
            )
        )
    if model_id == "knn":
        return _wrap(KNeighborsClassifier(n_neighbors=15, weights="distance"))
    if model_id == "random_forest":
        return _wrap(
            RandomForestClassifier(
                n_estimators=100,
                max_depth=16,
                min_samples_leaf=20,
                class_weight="balanced",
                n_jobs=-1,
                random_state=42,
            )
        )
    if model_id == "xgboost":
        if XGBClassifier is None:
            raise ImportError("xgboost is required for xgboost model")
        return _wrap(
            XGBClassifier(
                n_estimators=100,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                eval_metric="logloss",
                random_state=42,
                n_jobs=-1,
            )
        )
    if model_id == "neural_network":
        return _wrap(
            MLPClassifier(
                hidden_layer_sizes=(64, 32),
                max_iter=300,
                early_stopping=True,
                random_state=42,
            )
        )
    if model_id == "naive_bayes":
        return _wrap(GaussianNB())
    if model_id == "ensemble_voting":
        estimators = [
            ("lr", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
            (
                "rf",
                RandomForestClassifier(
                    n_estimators=80,
                    max_depth=14,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
            ("dt", DecisionTreeClassifier(max_depth=10, class_weight="balanced", random_state=42)),
        ]
        return Pipeline(
            [
                ("prep", build_preprocessor()),
                (
                    "clf",
                    VotingClassifier(estimators=estimators, voting="soft", n_jobs=-1),
                ),
            ]
        )
    if model_id == "anfis":
        # sklearn MLP proxy when full ANFIS library unavailable (research notebook parity note)
        return _wrap(
            MLPClassifier(
                hidden_layer_sizes=(32, 16),
                activation="tanh",
                max_iter=400,
                early_stopping=True,
                random_state=42,
            )
        )
    raise ValueError(model_id)


def all_model_builders() -> dict[str, callable]:
    return {mid: (lambda m=mid: build_model(m)) for mid in MODEL_IDS}
