"""Optional BRFSS 2024 LLCP ingest (AC-011)."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

# CDC calculated variable for MI/CHD composite (journal §IV-C)
MICHD_POSITIVE_VALUES = {1}


def load_llcp_csv(path: str | Path) -> pd.DataFrame:
    """Load LLCP CSV and map _MICHD target when present."""
    df = pd.read_csv(path, low_memory=False)
    if "_MICHD" in df.columns:
        df["HeartDiseaseorAttack"] = df["_MICHD"].apply(
            lambda v: 1 if v in MICHD_POSITIVE_VALUES else 0
        )
    elif "CVDCRHD4" in df.columns and "CVDINFR4" in df.columns:
        df["HeartDiseaseorAttack"] = (
            (df["CVDCRHD4"] == 1) | (df["CVDINFR4"] == 1)
        ).astype(int)
    else:
        raise ValueError("LLCP file missing _MICHD or CVDCRHD4/CVDINFR4 columns")
    return df


def apply_survey_weights(df: pd.DataFrame, weight_col: str = "_LLCPWT") -> pd.Series | None:
    if weight_col in df.columns:
        return df[weight_col]
    return None
