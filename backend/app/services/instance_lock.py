from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from app.core.config import settings


@contextmanager
def acquire_instance_lock() -> Iterator[None]:
    """Hold a cross-platform exclusive lock for the local Nextly data directory."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    lock_path = settings.data_dir / "nextly.instance.lock"
    handle = lock_path.open("a+b")
    try:
        handle.seek(0)
        if handle.read(1) == b"":
            handle.seek(0)
            handle.write(b"0")
            handle.flush()
        handle.seek(0)

        if __import__("os").name == "nt":
            import msvcrt

            try:
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as exc:
                raise RuntimeError(
                    "Nextly is already running. Close the local API before restoring a backup."
                ) from exc
        else:
            import fcntl

            try:
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError as exc:
                raise RuntimeError(
                    "Nextly is already running. Close the local API before restoring a backup."
                ) from exc

        try:
            yield
        finally:
            handle.seek(0)
            if __import__("os").name == "nt":
                import msvcrt

                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    finally:
        handle.close()