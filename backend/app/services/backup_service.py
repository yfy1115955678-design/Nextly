import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from uuid import UUID, uuid4

from app.core.config import settings


class BackupError(ValueError):
    pass


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def _safe_archive_name(name: str) -> PurePosixPath:
    if "\\\\" in name or "\\x00" in name:
        raise BackupError("Backup contains an invalid file path")
    path = PurePosixPath(name)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise BackupError("Backup contains an unsafe file path")
    return path


def _read_manifest(archive: zipfile.ZipFile) -> dict:
    try:
        manifest = json.loads(archive.read("manifest.json"))
    except (KeyError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise BackupError("Backup manifest is missing or invalid") from exc
    if manifest.get("format_version") != 1:
        raise BackupError("Unsupported backup format version")
    if not manifest.get("backup_id") or not manifest.get("database_sha256"):
        raise BackupError("Backup manifest is incomplete")
    return manifest


def inspect_backup(archive_path: Path, verify_database: bool = True) -> dict:
    try:
        with zipfile.ZipFile(archive_path, "r") as archive:
            infos = archive.infolist()
            if len(infos) > 20001:
                raise BackupError("Backup contains too many files")
            total_size = sum(info.file_size for info in infos)
            if total_size > 5 * 1024 * 1024 * 1024:
                raise BackupError("Backup exceeds the 5 GB restore limit")

            names = [info.filename for info in infos]
            if len(names) != len(set(names)):
                raise BackupError("Backup contains duplicate file paths")
            for name in names:
                _safe_archive_name(name)

            manifest = _read_manifest(archive)
            if "database/nextly.sqlite" not in names:
                raise BackupError("Backup database is missing")

            expected_storage = manifest.get("storage_files", [])
            expected_names = {"database/nextly.sqlite", "manifest.json"}
            for item in expected_storage:
                relative = _safe_archive_name(item["path"])
                if not relative.parts or relative.parts[0] != "storage":
                    raise BackupError("Backup storage path is invalid")
                expected_names.add(item["path"])

            actual_names = set(names)
            if actual_names != expected_names:
                raise BackupError("Backup file list does not match its manifest")

            db_digest = hashlib.sha256()
            with archive.open("database/nextly.sqlite") as source:
                while chunk := source.read(1024 * 1024):
                    db_digest.update(chunk)
            if db_digest.hexdigest() != manifest["database_sha256"]:
                raise BackupError("Backup database checksum does not match")

            for item in expected_storage:
                digest = hashlib.sha256()
                with archive.open(item["path"]) as source:
                    while chunk := source.read(1024 * 1024):
                        digest.update(chunk)
                if digest.hexdigest() != item["sha256"]:
                    raise BackupError(f"Backup file checksum failed: {item['path']}")

            if verify_database:
                with tempfile.TemporaryDirectory(prefix="nextly-backup-check-") as temp:
                    db_path = Path(temp) / "nextly.sqlite"
                    with archive.open("database/nextly.sqlite") as source, db_path.open("wb") as target:
                        shutil.copyfileobj(source, target)
                    connection = sqlite3.connect(db_path)
                    try:
                        result = connection.execute("PRAGMA integrity_check").fetchone()
                        if not result or result[0] != "ok":
                            raise BackupError("Backup database failed SQLite integrity check")
                    finally:
                        connection.close()

            return manifest
    except zipfile.BadZipFile as exc:
        raise BackupError("Backup file is not a valid ZIP archive") from exc


def create_backup() -> dict:
    database_path = settings.database_path
    if not database_path.is_file():
        raise BackupError("Nextly database does not exist yet")

    settings.backups_dir.mkdir(parents=True, exist_ok=True)
    backup_id = str(uuid4())
    created_at = datetime.now(timezone.utc)
    file_name = f"nextly-backup-{created_at.strftime('%Y%m%d-%H%M%S')}-{backup_id[:8]}.zip"
    destination = settings.backups_dir / file_name

    with tempfile.TemporaryDirectory(prefix="nextly-backup-") as temp:
        temp_dir = Path(temp)
        snapshot_db = temp_dir / "nextly.sqlite"
        source = sqlite3.connect(database_path)
        target = sqlite3.connect(snapshot_db)
        try:
            source.backup(target)
        finally:
            target.close()
            source.close()

        storage_files = []
        storage_root = settings.storage_dir
        if storage_root.exists():
            for path in sorted(storage_root.rglob("*")):
                if path.is_symlink() or not path.is_file():
                    continue
                relative = path.relative_to(storage_root).as_posix()
                archive_name = f"storage/{relative}"
                storage_files.append({
                    "path": archive_name,
                    "size_bytes": path.stat().st_size,
                    "sha256": _sha256_file(path),
                })

        manifest = {
            "format_version": 1,
            "backup_id": backup_id,
            "created_at": created_at.isoformat(),
            "app_version": settings.app_version,
            "database_sha256": _sha256_file(snapshot_db),
            "storage_files": storage_files,
        }

        temporary_archive = destination.with_suffix(".zip.part")
        try:
            with zipfile.ZipFile(
                temporary_archive,
                "w",
                compression=zipfile.ZIP_DEFLATED,
                compresslevel=6,
            ) as archive:
                archive.write(snapshot_db, "database/nextly.sqlite")
                for item in storage_files:
                    relative = item["path"].removeprefix("storage/")
                    archive.write(storage_root / Path(relative), item["path"])
                archive.writestr(
                    "manifest.json",
                    json.dumps(manifest, ensure_ascii=False, indent=2),
                )
            os.replace(temporary_archive, destination)
        except Exception:
            temporary_archive.unlink(missing_ok=True)
            raise

    return backup_metadata(destination)


def backup_metadata(archive_path: Path) -> dict:
    manifest = inspect_backup(archive_path, verify_database=False)
    return {
        "id": manifest["backup_id"],
        "file_name": archive_path.name,
        "created_at": manifest["created_at"],
        "size_bytes": archive_path.stat().st_size,
        "database_sha256": manifest["database_sha256"],
        "storage_file_count": len(manifest.get("storage_files", [])),
    }


def list_backups() -> list[dict]:
    if not settings.backups_dir.exists():
        return []
    backups = []
    for path in settings.backups_dir.glob("nextly-backup-*.zip"):
        try:
            backups.append(backup_metadata(path))
        except (BackupError, OSError, KeyError, TypeError):
            continue
    return sorted(backups, key=lambda item: item["created_at"], reverse=True)


def find_backup(backup_id: str) -> Path:
    try:
        normalized_id = str(UUID(backup_id))
    except ValueError as exc:
        raise BackupError("Invalid backup ID") from exc
    for path in settings.backups_dir.glob("nextly-backup-*.zip"):
        try:
            manifest = inspect_backup(path, verify_database=False)
        except BackupError:
            continue
        if manifest["backup_id"] == normalized_id:
            return path
    raise FileNotFoundError("Backup not found")


def prepare_restore(backup_id: str) -> dict:
    source = find_backup(backup_id)
    inspect_backup(source, verify_database=True)
    staged_id = str(uuid4())
    staged_dir = settings.backups_dir / "staged"
    staged_dir.mkdir(parents=True, exist_ok=True)
    destination = staged_dir / f"{staged_id}.zip"
    shutil.copy2(source, destination)
    return {
        "staged_id": staged_id,
        "backup_id": backup_id,
        "command": f"npm run db:restore -- --staged-id {staged_id}",
        "message": "Close the Nextly API before running the restore command. A safety backup of the current data is created automatically.",
    }


def restore_backup(archive_path: Path) -> dict:
    manifest = inspect_backup(archive_path, verify_database=True)
    settings.database_dir.mkdir(parents=True, exist_ok=True)
    settings.storage_dir.parent.mkdir(parents=True, exist_ok=True)
    settings.backups_dir.mkdir(parents=True, exist_ok=True)

    safety_backup = create_backup() if settings.database_path.is_file() else None
    with tempfile.TemporaryDirectory(
        prefix="nextly-restore-",
        dir=settings.backups_dir,
    ) as temp:
        staging = Path(temp)
        staged_db = staging / "nextly.sqlite"
        staged_storage = staging / "storage"
        staged_storage.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(archive_path, "r") as archive:
            with archive.open("database/nextly.sqlite") as source, staged_db.open("wb") as target:
                shutil.copyfileobj(source, target)
            for item in manifest.get("storage_files", []):
                relative = _safe_archive_name(item["path"])
                target_path = staging.joinpath(*relative.parts)
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(item["path"]) as source, target_path.open("wb") as target:
                    shutil.copyfileobj(source, target)

        connection = sqlite3.connect(staged_db)
        try:
            integrity = connection.execute("PRAGMA integrity_check").fetchone()
            if not integrity or integrity[0] != "ok":
                raise BackupError("Restored database failed SQLite integrity check")
        finally:
            connection.close()

        current_db = settings.database_path
        current_storage = settings.storage_dir
        old_db = staging / "previous.sqlite"
        old_storage = staging / "previous-storage"
        moved_db = False
        moved_storage = False

        try:
            for suffix in ("-wal", "-shm"):
                Path(str(current_db) + suffix).unlink(missing_ok=True)
            if current_db.exists():
                os.replace(current_db, old_db)
                moved_db = True
            if current_storage.exists():
                os.replace(current_storage, old_storage)
                moved_storage = True

            os.replace(staged_db, current_db)
            os.replace(staged_storage, current_storage)
        except Exception:
            current_db.unlink(missing_ok=True)
            if moved_db and old_db.exists():
                os.replace(old_db, current_db)
            if current_storage.exists():
                shutil.rmtree(current_storage, ignore_errors=True)
            if moved_storage and old_storage.exists():
                os.replace(old_storage, current_storage)
            raise

    return {
        "restored_backup_id": manifest["backup_id"],
        "safety_backup_id": safety_backup["id"] if safety_backup else None,
        "message": "Backup restored. Start Nextly again to use the restored data.",
    }


def restore_staged_backup(staged_id: str) -> dict:
    try:
        normalized_id = str(UUID(staged_id))
    except ValueError as exc:
        raise BackupError("Invalid staged restore ID") from exc
    archive_path = settings.backups_dir / "staged" / f"{normalized_id}.zip"
    if not archive_path.is_file():
        raise FileNotFoundError("Staged restore archive not found")
    result = restore_backup(archive_path)
    archive_path.unlink(missing_ok=True)
    return result