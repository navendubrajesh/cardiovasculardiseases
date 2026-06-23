"""BRFSS data loading and validation (AC-010, AC-012)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from .constants import ALL_COLUMNS, FEATURE_COLUMNS, TARGET_COLUMN


class DatasetValidationError(ValueError):
    pass


def validate_brfss_frame(df: pd.DataFrame) -> dict:
    """Validate schema and return summary stats."""
    missing_cols = set(ALL_COLUMNS) - set(df.columns)
    if missing_cols:
        raise DatasetValidationError(f"Missing columns: {sorted(missing_cols)}")

    extra = set(df.columns) - set(ALL_COLUMNS)
    if extra:
        raise DatasetValidationError(f"Unexpected columns: {sorted(extra)}")

    missing_cells = int(df.isna().sum().sum())
    if missing_cells > 0:
        raise DatasetValidationError(f"Dataset has {missing_cells} missing cells; expected 0")

    prevalence = float(df[TARGET_COLUMN].mean())
    return {
        "rows": len(df),
        "columns": len(df.columns),
        "missing_cells": missing_cells,
        "positive_prevalence": prevalence,
        "positive_count": int(df[TARGET_COLUMN].sum()),
    }


def load_brfss_csv(path: str | Path) -> tuple[pd.DataFrame, pd.Series, dict]:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"BRFSS CSV not found: {path}")

    df = pd.read_csv(path)
    stats = validate_brfss_frame(df)
    x = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()
    return x, y, stats


def generate_synthetic_brfss(n_rows: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Synthetic BRFSS-like data for tests/CI when full CSV unavailable."""
    rng = np.random.default_rng(seed)
    n_pos = max(1, int(n_rows * 0.093))

    rows = []
    for i in range(n_rows):
        is_pos = i < n_pos
        age = int(rng.integers(1, 15))
        bmi = float(rng.uniform(18, 45))
        if is_pos:
            bmi += rng.uniform(2, 8)
        rows.append(
            {
                "HighBP": int(is_pos or rng.random() < 0.35),
                "HighChol": int(is_pos or rng.random() < 0.3),
                "CholCheck": int(rng.random() < 0.85),
                "BMI": round(bmi, 1),
                "Smoker": int(is_pos or rng.random() < 0.2),
                "Stroke": int(is_pos and rng.random() < 0.15),
                "Diabetes": int(is_pos or rng.random() < 0.12),
                "PhysActivity": int(not is_pos and rng.random() < 0.7),
                "Fruits": int(rng.random() < 0.6),
                "Veggies": int(rng.random() < 0.65),
                "HvyAlcoholConsump": int(rng.random() < 0.05),
                "AnyHealthcare": int(rng.random() < 0.85),
                "NoDocbcCost": int(rng.random() < 0.12),
                "GenHlth": int(rng.integers(2, 6) if is_pos else rng.integers(1, 4)),
                "MentHlth": int(rng.integers(0, 15)),
                "PhysHlth": int(rng.integers(0, 20) if is_pos else rng.integers(0, 8)),
                "DiffWalk": int(is_pos and rng.random() < 0.2),
                "Sex": int(rng.integers(0, 2)),
                "Age": age,
                "Education": int(rng.integers(1, 7)),
                "Income": int(rng.integers(1, 9)),
                TARGET_COLUMN: int(is_pos),
            }
        )
    df = pd.DataFrame(rows)
    rng.shuffle(df.values)  # type: ignore[arg-type]
    return df
