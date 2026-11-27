import shutil
import sys
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event, inspect

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="nextly-test-"))

from alembic import command
from alembic.config import Config

alembic_config = Config(str(BACKEND_DIR / "alembic.ini"))


@pytest.fixture(autouse=True)
def isolated_local_data(monkeypatch):
    from app.core.config import settings
    from app.db import session as db_session
    import app.main as main_module

    original_engine = db_session.engine
    original_engine.dispose()

    monkeypatch.setattr(settings, "data_dir", TEST_DATA_DIR)

    shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)
    TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)

    test_engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False, "timeout": 5},
        pool_pre_ping=True,
    )

    @event.listens_for(test_engine, "connect")
    def configure_test_sqlite_connection(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

    monkeypatch.setattr(db_session, "engine", test_engine)
    monkeypatch.setattr(main_module, "engine", test_engine)
    db_session.SessionLocal.configure(bind=test_engine)

    with test_engine.connect() as connection:
        alembic_config.attributes["connection"] = connection
        try:
            command.upgrade(alembic_config, "head")
        finally:
            alembic_config.attributes.pop("connection", None)
        tables = set(inspect(connection).get_table_names())
    assert "product_concepts" in tables
    assert "variant_versions" in tables

    yield

    test_engine.dispose()
    db_session.SessionLocal.configure(bind=original_engine)