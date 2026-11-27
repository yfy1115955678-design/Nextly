import os
import shutil
import sys
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import inspect

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="nextly-test-"))
os.environ["NEXTLY_DATA_DIR"] = str(TEST_DATA_DIR)

from app.core.config import settings

# Set the cached settings object before test modules import the application
# and create the shared SQLAlchemy engine.
settings.data_dir = TEST_DATA_DIR

from alembic import command
from alembic.config import Config

alembic_config = Config(str(BACKEND_DIR / "alembic.ini"))


@pytest.fixture(autouse=True)
def isolated_local_data():
    from app.db.session import engine

    engine.dispose()
    shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)
    settings.database_dir.mkdir(parents=True, exist_ok=True)

    assert Path(engine.url.database) == settings.database_path

    with engine.connect() as connection:
        alembic_config.attributes["connection"] = connection
        try:
            command.upgrade(alembic_config, "head")
        finally:
            alembic_config.attributes.pop("connection", None)

        tables = set(inspect(connection).get_table_names())

    assert "product_concepts" in tables
    assert "variant_versions" in tables

    yield

    engine.dispose()