from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FileAsset(Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"),
        index=True,
    )
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_rel_path: Mapped[str] = mapped_column(String(600), nullable=False, unique=True)
    mime_type: Mapped[str | None] = mapped_column(String(160))
    extension: Mapped[str | None] = mapped_column(String(20))
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sha256: Mapped[str | None] = mapped_column(String(64))
    file_kind: Mapped[str] = mapped_column(String(40), nullable=False, default="other")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)