"""Backend prediction integration test (AC-060, AC-035)."""
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.index import app

MODELS_DIR = Path(__file__).resolve().parents[1] / ".." / "ai-cardiologist-ml" / "models" / "artifacts"
os.environ["MODELS_DIR"] = str(MODELS_DIR.resolve())


@pytest.fixture
def client():
    return TestClient(app)


SAMPLE_FEATURES = {
    "HighBP": 1, "HighChol": 1, "CholCheck": 1, "BMI": 28.5, "Smoker": 0,
    "Stroke": 0, "Diabetes": 0, "PhysActivity": 1, "Fruits": 1, "Veggies": 1,
    "HvyAlcoholConsump": 0, "AnyHealthcare": 1, "NoDocbcCost": 0, "GenHlth": 3,
    "MentHlth": 2, "PhysHlth": 3, "DiffWalk": 0, "Sex": 1, "Age": 8,
    "Education": 4, "Income": 5,
}


@pytest.mark.skipif(not (MODELS_DIR / "ensemble_voting.joblib").exists(), reason="Models not trained")
def test_prediction_run(client):
    r = client.post(
        "/api/predictions/run",
        json={
            "modelId": "ensemble_voting",
            "features": SAMPLE_FEATURES,
            "disclaimerAcknowledged": True,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert "probability" in body
    assert body["modelId"] == "ensemble_voting"


@pytest.mark.skipif(not (MODELS_DIR / "ensemble_voting.joblib").exists(), reason="Models not trained")
def test_partial_features_imputed(client):
    # Only the top significant predictors; the rest must be imputed server-side.
    partial = {"GenHlth": 5, "Age": 12, "HighBP": 1, "BMI": 34, "HighChol": 1}
    r = client.post(
        "/api/predictions/run",
        json={"modelId": "ensemble_voting", "features": partial, "disclaimerAcknowledged": True},
    )
    assert r.status_code == 200
    body = r.json()
    assert "probability" in body
    assert set(body["enteredFeatures"]) == set(partial.keys())


@pytest.mark.skipif(not (MODELS_DIR / "ensemble_voting.joblib").exists(), reason="Models not trained")
def test_multi_model_prediction(client):
    r = client.post(
        "/api/predictions/run-multi",
        json={
            "modelIds": ["ensemble_voting", "logistic_regression"],
            "features": SAMPLE_FEATURES,
            "disclaimerAcknowledged": True,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body["results"]) == 2
    ids = {item["modelId"] for item in body["results"]}
    assert ids == {"ensemble_voting", "logistic_regression"}
