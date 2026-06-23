import pandas as pd

from aicardio.constants import MODEL_IDS
from aicardio.data import generate_synthetic_brfss
from aicardio.evaluation import evaluate_model, train_all_models
from aicardio.models import build_model


def test_all_models_train_and_predict():
    df = generate_synthetic_brfss(800)
    x = df.drop(columns=["HeartDiseaseorAttack"])
    y = df["HeartDiseaseorAttack"]
    for mid in MODEL_IDS:
        model = build_model(mid)
        model.fit(x, y)
        preds = model.predict(x.head(5))
        assert len(preds) == 5


def test_leaderboard_structure():
    df = generate_synthetic_brfss(600)
    x = df.drop(columns=["HeartDiseaseorAttack"])
    y = df["HeartDiseaseorAttack"]
    lb = train_all_models(x, y, model_ids=["logistic_regression", "ensemble_voting"])
    assert "models" in lb
    assert "logistic_regression" in lb["models"]
    assert "accuracy" in lb["models"]["logistic_regression"]


def test_evaluate_model_metrics():
    df = generate_synthetic_brfss(400)
    x = df.drop(columns=["HeartDiseaseorAttack"])
    y = df["HeartDiseaseorAttack"]
    model = build_model("logistic_regression")
    split = int(len(x) * 0.7)
    model.fit(x.iloc[:split], y.iloc[:split])
    metrics = evaluate_model(model, x.iloc[split:], y.iloc[split:])
    assert "roc_auc" in metrics
    assert "calibration" in metrics
    assert "confusion_matrix" in metrics
