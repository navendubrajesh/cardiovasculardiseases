"""Research metrics API tests."""
import json
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.index import app


@pytest.fixture
def client():
    return TestClient(app)


def test_metrics_returns_json_safe_leaderboard(client, monkeypatch):
    leaderboard = {
        "defaultModelId": "ensemble_voting",
        "train_rows": 100,
        "test_rows": 50,
        "models": {
            "ensemble_voting": {
                "label": "Ensemble (Voting)",
                "accuracy": 0.89,
                "test_accuracy": 0.89,
                "train_accuracy": 0.91,
                "f1": 0.45,
                "roc_auc": 0.82,
                "recall": 0.5,
            },
        },
    }
    with tempfile.TemporaryDirectory() as tmp:
        models_dir = Path(tmp)
        (models_dir / "leaderboard.json").write_text(json.dumps(leaderboard), encoding="utf-8")
        monkeypatch.setattr(
            "api.routers.research.ML_MODELS_DIR",
            models_dir,
        )
        r = client.get("/api/research/metrics")
        assert r.status_code == 200
        body = r.json()
        assert "ensemble_voting" in body["models"]
        assert body["models"]["ensemble_voting"]["test_accuracy"] == 0.89


def test_metrics_slims_full_file_without_inf(client, monkeypatch):
    full = {
        "default_model_id": "ensemble_voting",
        "models": {
            "svm": {
                "train_accuracy": 0.99,
                "accuracy": 0.88,
                "precision": 0.5,
                "recall": 0.6,
                "f1": 0.55,
                "roc_auc": 0.8,
                "roc_curve": {"thresholds": [float("inf"), 0.5, 0.1]},
            },
        },
    }
    with tempfile.TemporaryDirectory() as tmp:
        models_dir = Path(tmp)
        (models_dir / "metrics.json").write_text(json.dumps(full), encoding="utf-8")
        monkeypatch.setattr("api.routers.research.ML_MODELS_DIR", models_dir)
        r = client.get("/api/research/metrics")
        assert r.status_code == 200
        body = r.json()
        assert body["models"]["svm"]["accuracy"] == 0.88
        assert "roc_curve" not in body["models"]["svm"]
