from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str | None
    original_name: str
    mime_type: str | None
    extension: str | None
    size_bytes: int
    sha256: str | None
    file_kind: str
    created_at: datetime