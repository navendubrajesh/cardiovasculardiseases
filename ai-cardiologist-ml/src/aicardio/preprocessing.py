"""Leakage-safe preprocessing pipeline (AC-012)."""
from __future__ import annotations

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, StandardScaler

from .constants import FEATURE_COLUMNS, SCALE_COLUMNS


def build_preprocessor() -> ColumnTransformer:
    scale_cols = [c for c in FEATURE_COLUMNS if c in SCALE_COLUMNS]
    pass_cols = [c for c in FEATURE_COLUMNS if c not in SCALE_COLUMNS]

    scale_pipe = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    pass_pipe = Pipeline([("imputer", SimpleImputer(strategy="most_frequent"))])

    return ColumnTransformer(
        transformers=[
            ("scale", scale_pipe, scale_cols),
            ("pass", pass_pipe, pass_cols),
        ],
        remainder="drop",
    )


def build_anfis_scaler_pipeline() -> Pipeline:
    """MinMax scaling for ANFIS fuzzy baseline (AC-027)."""
    return Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", MinMaxScaler()),
        ]
    )
