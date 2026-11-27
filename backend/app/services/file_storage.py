import hashlib
import os
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import settings


def normalize_filename(filename: str | None) -> str:
    normalized = (filename or "upload.bin").replace("\\", "/").split("/")[-1].strip()
    if not normalized or normalized in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return normalized


def classify_file(filename: str) -> str:
    suffix = Path(normalize_filename(filename)).suffix.lower()
    if suffix in {".xlsx", ".xls", ".csv"}:
        return "research_data"
    if suffix in {".png", ".jpg", ".jpeg", ".webp", ".svg"}:
        return "image"
    if suffix in {".pdf", ".doc", ".docx", ".md", ".txt"}:
        return "document"
    if suffix == ".zip":
        return "archive"
    return "other"


async def persist_upload(project_id: str, upload: UploadFile) -> tuple[str, str, int, str]:
    original_name = normalize_filename(upload.filename)
    suffix = Path(original_name).suffix.lower()[:16]
    file_id = str(uuid4())
    relative_path = Path("projects") / project_id / "inbox" / (file_id + suffix)
    storage_root = settings.storage_dir.resolve()
    destination = (storage_root / relative_path).resolve()

    if not destination.is_relative_to(storage_root):
        raise HTTPException(status_code=400, detail="Invalid storage path")

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".part")
    digest = hashlib.sha256()
    size = 0

    try:
        with temporary.open("wb") as target:
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_upload_bytes:
                    raise HTTPException(status_code=413, detail="File exceeds 100 MB limit")
                digest.update(chunk)
                target.write(chunk)

        os.replace(temporary, destination)
    except Exception:
        temporary.unlink(missing_ok=True)
        destination.unlink(missing_ok=True)
        raise
    finally:
        await upload.close()

    return relative_path.as_posix(), digest.hexdigest(), size, file_id