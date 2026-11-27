from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.file_asset import FileAsset
from app.models.project import Project
from app.schemas.file_asset import FileRead
from app.services.file_storage import classify_file, persist_upload

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=FileRead, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> FileAsset:
    project = db.get(Project, project_id)
    if project is None or project.status == "archived":
        raise HTTPException(status_code=404, detail="Project not found")

    relative_path, sha256, size, file_id = await persist_upload(project_id, file)
    asset = FileAsset(
        id=file_id,
        project_id=project_id,
        original_name=Path(file.filename or "upload.bin").name,
        stored_rel_path=relative_path,
        mime_type=file.content_type,
        extension=Path(file.filename or "").suffix.lower(),
        size_bytes=size,
        sha256=sha256,
        file_kind=classify_file(file.filename or ""),
        created_at=datetime.now(timezone.utc),
    )

    try:
        db.add(asset)
        db.commit()
        db.refresh(asset)
    except Exception:
        db.rollback()
        stored_path = (settings.storage_dir / relative_path).resolve()
        if stored_path.is_relative_to(settings.storage_dir.resolve()):
            stored_path.unlink(missing_ok=True)
        raise

    return asset


@router.get("", response_model=list[FileRead])
def list_files(project_id: str, db: Session = Depends(get_db)) -> list[FileAsset]:
    statement = (
        select(FileAsset)
        .where(FileAsset.project_id == project_id)
        .order_by(FileAsset.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.get("/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db)) -> FileResponse:
    asset = db.get(FileAsset, file_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="File not found")

    storage_root = settings.storage_dir.resolve()
    path = (storage_root / asset.stored_rel_path).resolve()
    if not path.is_relative_to(storage_root) or not path.is_file():
        raise HTTPException(status_code=404, detail="Stored file not found")

    return FileResponse(
        path=path,
        filename=asset.original_name,
        media_type=asset.mime_type or "application/octet-stream",
    )