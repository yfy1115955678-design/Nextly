import hashlib

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "ok"


def test_project_crud_and_archive(client: TestClient):
    created = client.post(
        "/api/projects",
        json={
            "name": "Nextly Test Project",
            "category": "Home",
            "target_market": "US",
            "description": "API smoke test",
        },
    )
    assert created.status_code == 201
    project = created.json()
    project_id = project["id"]

    fetched = client.get("/api/projects/" + project_id)
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Nextly Test Project"

    updated = client.patch(
        "/api/projects/" + project_id,
        json={"name": "Updated Project", "status": "paused"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Project"
    assert updated.json()["status"] == "paused"

    archived = client.delete("/api/projects/" + project_id)
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"
    assert client.get("/api/projects/" + project_id).status_code == 404


def test_file_upload_list_download_and_path_sanitization(client: TestClient):
    project_response = client.post(
        "/api/projects",
        json={"name": "File Test Project"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    content = b"asin,price\nB000TEST,19.99\n"
    uploaded = client.post(
        "/api/files/upload",
        data={"project_id": project_id},
        files={"file": ("..\\\\bsr.csv", content, "text/csv")},
    )
    assert uploaded.status_code == 201
    file_record = uploaded.json()
    assert file_record["original_name"] == "bsr.csv"
    assert file_record["size_bytes"] == len(content)
    assert file_record["sha256"] == hashlib.sha256(content).hexdigest()

    listed = client.get("/api/files", params={"project_id": project_id})
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    downloaded = client.get("/api/files/" + file_record["id"] + "/download")
    assert downloaded.status_code == 200
    assert downloaded.content == content


def test_project_and_file_metadata_survive_app_restart(client: TestClient):
    created = client.post("/api/projects", json={"name": "Persistence Test"})
    assert created.status_code == 201
    project_id = created.json()["id"]

    # A second TestClient context reuses the same local database and file store.
    with TestClient(app) as second_client:
        fetched = second_client.get("/api/projects/" + project_id)
        assert fetched.status_code == 200
        assert fetched.json()["name"] == "Persistence Test"