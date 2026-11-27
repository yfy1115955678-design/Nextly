import tempfile
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db.session import engine
from app.main import app
from app.services.backup_service import BackupError, restore_staged_backup
from app.services.instance_lock import acquire_instance_lock


def test_backup_restore_roundtrip_preserves_database_and_files():
    with TestClient(app) as client:
        project_response = client.post(
            "/api/projects",
            json={"name": "Original Project"},
        )
        assert project_response.status_code == 201
        project_id = project_response.json()["id"]

        original_content = b"source,value\noriginal,1\n"
        upload_response = client.post(
            "/api/files/upload",
            data={"project_id": project_id},
            files={"file": ("original.csv", original_content, "text/csv")},
        )
        assert upload_response.status_code == 201

        backup_response = client.post("/api/backups")
        assert backup_response.status_code == 201
        backup = backup_response.json()
        assert backup["storage_file_count"] == 1

        staged_response = client.post(
            f"/api/backups/{backup['id']}/restore/prepare"
        )
        assert staged_response.status_code == 201
        staged_id = staged_response.json()["staged_id"]
        assert "--staged-id " + staged_id in staged_response.json()["command"]

        changed = client.patch(
            "/api/projects/" + project_id,
            json={"name": "Changed After Backup"},
        )
        assert changed.status_code == 200

        later_content = b"source,value\nlater,2\n"
        later_upload = client.post(
            "/api/files/upload",
            data={"project_id": project_id},
            files={"file": ("later.csv", later_content, "text/csv")},
        )
        assert later_upload.status_code == 201

    engine.dispose()
    with acquire_instance_lock():
        restored = restore_staged_backup(staged_id)

    assert restored["restored_backup_id"] == backup["id"]
    assert restored["safety_backup_id"]

    with TestClient(app) as restored_client:
        project = restored_client.get("/api/projects/" + project_id)
        assert project.status_code == 200
        assert project.json()["name"] == "Original Project"

        files = restored_client.get(
            "/api/files",
            params={"project_id": project_id},
        )
        assert files.status_code == 200
        assert len(files.json()) == 1

        file_id = files.json()[0]["id"]
        download = restored_client.get(f"/api/files/{file_id}/download")
        assert download.status_code == 200
        assert download.content == original_content

        backups = restored_client.get("/api/backups")
        assert backups.status_code == 200
        assert len(backups.json()) >= 2


def test_backup_rejects_archive_path_traversal():
    with tempfile.TemporaryDirectory(prefix="nextly-malicious-backup-") as temp:
        archive_path = Path(temp) / "malicious.zip"
        with zipfile.ZipFile(archive_path, "w") as archive:
            archive.writestr("../outside.txt", "not allowed")

        with pytest.raises(BackupError, match="invalid file path|unsafe file path"):
            from app.services.backup_service import inspect_backup

            inspect_backup(archive_path)
