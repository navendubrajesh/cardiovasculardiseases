"""Generate EDA artifacts (AC-013)."""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

from aicardio.constants import FEATURE_COLUMNS, TARGET_COLUMN
from aicardio.data import generate_synthetic_brfss, load_brfss_csv


def run_eda(data_path: str | None, out_dir: str) -> None:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    if data_path and Path(data_path).exists():
        df = pd.read_csv(data_path)
    else:
        df = generate_synthetic_brfss(5000)

    corr = df[FEATURE_COLUMNS + [TARGET_COLUMN]].corr()[TARGET_COLUMN].drop(TARGET_COLUMN)
    top = corr.abs().sort_values(ascending=False).head(10)
    top.to_csv(out / "top_correlations.csv")

    plt.figure(figsize=(8, 6))
    sns.heatmap(df[FEATURE_COLUMNS[:12]].corr(), cmap="coolwarm", center=0)
    plt.tight_layout()
    plt.savefig(out / "correlation_heatmap.png", dpi=120)
    plt.close()

    summary = {
        "rows": len(df),
        "positive_prevalence": float(df[TARGET_COLUMN].mean()),
        "top_correlations": top.to_dict(),
    }
    (out / "eda_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"EDA written to {out}")


if __name__ == "__main__":
    import sys

    run_eda(sys.argv[1] if len(sys.argv) > 1 else None, sys.argv[2] if len(sys.argv) > 2 else "eda")
