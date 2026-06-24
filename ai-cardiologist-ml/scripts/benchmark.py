"""Benchmark all models, export leaderboard JSON, and write holdout test Excel."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from aicardio.constants import FEATURE_COLUMNS, TARGET_COLUMN, MODEL_IDS
from aicardio.data import generate_synthetic_brfss, load_brfss_csv
from aicardio.evaluation import save_leaderboard, stratified_train_test_split, train_all_models


def _resolve_data(args) -> tuple[pd.DataFrame, pd.Series, dict]:
    if args.data and Path(args.data).exists():
        x, y, stats = load_brfss_csv(args.data)
        return x, y, stats
    print(f"No data at {args.data}; using synthetic dataset ({args.synthetic_rows} rows)")
    df = generate_synthetic_brfss(n_rows=args.synthetic_rows)
    stats = {"rows": len(df), "synthetic": True}
    return df[FEATURE_COLUMNS], df[TARGET_COLUMN], stats


def cmd_benchmark(args):
    x, y, stats = _resolve_data(args)
    print("Dataset:", json.dumps(stats, indent=2))

    model_ids = args.models.split(",") if args.models else MODEL_IDS
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    x_train, x_test, y_train, y_test = stratified_train_test_split(
        x, y, test_size=args.test_size, random_state=args.random_state
    )

    holdout = x_test.copy()
    holdout[TARGET_COLUMN] = y_test.values
    excel_path = Path(args.excel_out)
    excel_path.parent.mkdir(parents=True, exist_ok=True)
    holdout.to_excel(excel_path, index=False)
    print(f"Holdout test rows ({len(holdout)}) written to {excel_path}")

    leaderboard = train_all_models(
        x,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
        model_ids=model_ids,
    )
    metrics_path = out_dir / "metrics.json"
    save_leaderboard(leaderboard, metrics_path)
    print(f"Leaderboard written to {metrics_path} and {out_dir / 'leaderboard.json'}")


def main():
    parser = argparse.ArgumentParser(description="Benchmark models and export test holdout Excel")
    parser.add_argument("--data", default="data/heart_disease_health_indicators_BRFSS2015.csv")
    parser.add_argument("--out", default="models")
    parser.add_argument(
        "--excel-out",
        default="data/benchmark_holdout_test.xlsx",
        help="Path for stratified holdout test split (features + label)",
    )
    parser.add_argument("--synthetic-rows", type=int, default=8000)
    parser.add_argument("--test-size", type=float, default=0.3)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--models", default="", help="Comma-separated model ids")
    args = parser.parse_args()
    cmd_benchmark(args)


if __name__ == "__main__":
    main()
