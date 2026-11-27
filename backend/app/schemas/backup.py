from datetime import datetime
from pydantic import BaseModel


class BackupRead(BaseModel):
    id: str
    file_name: str
    created_at: datetime
    size_bytes: int
    database_sha256: str
    storage_file_count: int


class RestorePrepareRead(BaseModel):
    staged_id: str
    backup_id: str
    command: str
    message: str