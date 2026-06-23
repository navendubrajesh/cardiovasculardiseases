"""CLI entrypoints."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib

from aicardio.constants import DEFAULT_MODEL_ID, MODEL_IDS
from aicardio.data import generate_synthetic_brfss, load_brfss_csv
from aicardio.evaluation import save_leaderboard, train_all_models
from aicardio.export import export_model, write_registry
from aicardio.explainability import global_feature_importance
from aicardio.models import build_model


def _resolve_data(args) -> tuple:
    if args.data and Path(args.data).exists():
        return load_brfss_csv(args.data)
    print(f"No data at {args.data}; using synthetic dataset ({args.synthetic_rows} rows)")
    df = generate_synthetic_brfss(n_rows=args.synthetic_rows)
    from aicardio.constants import FEATURE_COLUMNS, TARGET_COLUMN

    return df[FEATURE_COLUMNS], df[TARGET_COLUMN], {"rows": len(df), "synthetic": True}


def cmd_train(args):
    x, y, stats = _resolve_data(args)
    print("Dataset stats:", json.dumps(stats, indent=2))

    model_ids = args.models.split(",") if args.models else MODEL_IDS
    leaderboard = train_all_models(x, y, model_ids=model_ids)
    out_metrics = Path(args.out) / "metrics.json"
    save_leaderboard(leaderboard, out_metrics)
    print(f"Leaderboard written to {out_metrics}")

    models_dir = Path(args.out) / "artifacts"
    models_dir.mkdir(parents=True, exist_ok=True)
    x_train = x.sample(frac=0.7, random_state=42)
    y_train = y.loc[x_train.index]

    trained = []
    for mid in model_ids:
        if mid not in leaderboard["models"] or "error" in leaderboard["models"][mid]:
            print(f"Skipping export for {mid}: training failed")
            continue
        model = build_model(mid)
        model.fit(x, y)
        export_model(model, mid, models_dir)
        trained.append(mid)
        print(f"Exported {mid}")

    write_registry(models_dir, trained)

    # Global explainability for default model
    default = build_model(DEFAULT_MODEL_ID)
    default.fit(x, y)
    global_imp = global_feature_importance(default, x.sample(min(500, len(x)), random_state=42))
    (Path(args.out) / "global_importance.json").write_text(
        json.dumps(global_imp, indent=2), encoding="utf-8"
    )


def cmd_predict(args):
    model = joblib.load(Path(args.models_dir) / f"{args.model}.joblib")
    features = json.loads(args.features)
    import pandas as pd

    row = pd.DataFrame([features])
    proba = float(model.predict_proba(row)[0, 1])
    pred = int(model.predict(row)[0])
    print(json.dumps({"prediction": pred, "probability": proba}))


def main():
    parser = argparse.ArgumentParser(description="AI Cardiologist ML pipeline")
    sub = parser.add_subparsers(dest="cmd")

    train_p = sub.add_parser("train", help="Train all models and export artifacts")
    train_p.add_argument("--data", default="data/heart_disease_health_indicators_BRFSS2015.csv")
    train_p.add_argument("--out", default="models")
    train_p.add_argument("--synthetic-rows", type=int, default=8000)
    train_p.add_argument("--models", default="", help="Comma-separated model ids")
    train_p.set_defaults(func=cmd_train)

    pred_p = sub.add_parser("predict", help="Single prediction from JSON features")
    pred_p.add_argument("--models-dir", default="models/artifacts")
    pred_p.add_argument("--model", default=DEFAULT_MODEL_ID)
    pred_p.add_argument("--features", required=True)
    pred_p.set_defaults(func=cmd_predict)

    args = parser.parse_args()
    if not args.cmd:
        parser.print_help()
        return
    args.func(args)


if __name__ == "__main__":
    main()
