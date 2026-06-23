"""Model serialization for web/backend inference (AC-035)."""
from __future__ import annotations

import json
from pathlib import Path

import joblib

from .constants import DEFAULT_MODEL_ID, FEATURE_COLUMNS, FEATURE_DEFINITIONS, MODEL_IDS
from .models import build_model


def export_model(model, model_id: str, out_dir: str | Path) -> Path:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / f"{model_id}.joblib"
    joblib.dump(model, model_path)

    manifest = {
        "model_id": model_id,
        "default": model_id == DEFAULT_MODEL_ID,
        "feature_columns": FEATURE_COLUMNS,
        "feature_definitions": FEATURE_DEFINITIONS,
        "format": "joblib",
        "sklearn_pipeline": True,
    }
    (out_dir / f"{model_id}.manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    return model_path


def load_model(model_id: str, models_dir: str | Path):
    path = Path(models_dir) / f"{model_id}.joblib"
    if not path.exists():
        raise FileNotFoundError(path)
    return joblib.load(path)


def write_registry(models_dir: str | Path, trained_ids: list[str]) -> None:
    registry = {
        "models": trained_ids,
        "default_model_id": DEFAULT_MODEL_ID,
        "all_model_ids": MODEL_IDS,
    }
    Path(models_dir).joinpath("registry.json").write_text(
        json.dumps(registry, indent=2), encoding="utf-8"
    )
