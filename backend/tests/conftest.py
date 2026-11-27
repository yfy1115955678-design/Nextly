import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="nextly-test-"))
os.environ["NEXTLY_DATA_DIR"] = str(TEST_DATA_DIR)

from alembic import command
from alembic.config import Config

alembic_config = Config(str(BACKEND_DIR / "alembic.ini"))
command.upgrade(alembic_config, "head")