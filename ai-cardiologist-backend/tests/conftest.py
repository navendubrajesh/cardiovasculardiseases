"""Pytest defaults."""
import os
import tempfile

import pytest

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DEV_SKIP_AUTH"] = "true"
os.environ["DEV_TENANT_ID"] = "tenant-dev"
os.environ["AI_CARDIO_DB"] = _tmp.name


@pytest.fixture(scope="session", autouse=True)
def _bootstrap_db():
    from api.db import init_db, seed_demo_data

    init_db()
    seed_demo_data()
    yield
