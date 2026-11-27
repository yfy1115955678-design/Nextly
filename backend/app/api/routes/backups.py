from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.schemas.backup import BackupRead, RestorePrepareRead
from app.services.backup_service import (
    BackupError,
    create_backup,
    find_backup,
    list_backups,
    prepare_restore,
)

router = APIRouter(prefix="/backups", tags=["backups"])


@router.get("", response_model=list[BackupRead])
def get_backups() -> list[dict]:
    return list_backups()


@router.post("", response_model=BackupRead, status_code=status.HTTP_201_CREATED)
def make_backup() -> dict:
    try:
        return create_backup()
    except BackupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/{backup_id}/download")
def download_backup(backup_id: str) -> FileResponse:
    try:
        path = find_backup(backup_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Backup not found") from exc
    except BackupError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FileResponse(
        path=path,
        filename=path.name,
        media_type="application/zip",
    )


@router.post(
    "/{backup_id}/restore/prepare",
    response_model=RestorePrepareRead,
    status_code=status.HTTP_201_CREATED,
)
def stage_backup_restore(backup_id: str) -> dict:
    try:
        return prepare_restore(backup_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Backup not found") from exc
    except BackupError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc