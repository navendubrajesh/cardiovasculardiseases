import pandas as pd
import pytest

from aicardio.constants import ALL_COLUMNS, TARGET_COLUMN
from aicardio.data import DatasetValidationError, generate_synthetic_brfss, validate_brfss_frame


def test_synthetic_schema():
    df = generate_synthetic_brfss(1000)
    assert list(df.columns) == ALL_COLUMNS
    stats = validate_brfss_frame(df)
    assert stats["rows"] == 1000
    assert stats["missing_cells"] == 0


def test_validate_rejects_missing_columns():
    df = generate_synthetic_brfss(10).drop(columns=[TARGET_COLUMN])
    with pytest.raises(DatasetValidationError):
        validate_brfss_frame(df)


def test_validate_rejects_missing_values():
    df = generate_synthetic_brfss(10)
    df.loc[0, "BMI"] = None
    with pytest.raises(DatasetValidationError):
        validate_brfss_frame(df)
