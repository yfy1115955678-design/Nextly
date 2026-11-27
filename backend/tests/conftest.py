import os
import shutil
import sys
import tempfile
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="nextly-test-"))
os.environ["NEXTLY_DATA_DIR"] = str(TEST_DATA_DIR)

from alembic import command
from alembic.config import Config

alembic_config = Config(str(BACKEND_DIR / "alembic.ini"))


@pytest.fixture(autouse=True)
def isolated_local_data():
    from app.db.session import engine

    engine.dispose()
    shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)
    TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)
    command.upgrade(alembic_config, "head")
    yield
    engine.dispose()