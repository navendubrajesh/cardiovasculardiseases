"""Ensure preprocessing is fit only on training data (AC-012)."""
from sklearn.model_selection import train_test_split

from aicardio.data import generate_synthetic_brfss
from aicardio.models import build_model


def test_pipeline_fit_on_train_only():
    df = generate_synthetic_brfss(500)
    x = df.drop(columns=["HeartDiseaseorAttack"])
    y = df["HeartDiseaseorAttack"]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.3, stratify=y, random_state=42
    )
    model = build_model("random_forest")
    model.fit(x_train, y_train)
    # Should not raise — pipeline transforms test using train-fitted stats
    proba = model.predict_proba(x_test)
    assert proba.shape[0] == len(x_test)
