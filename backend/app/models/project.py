from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'paused', 'archived')",
            name="ck_projects_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120))
    target_market: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    module_states: Mapped[list["ProjectModuleState"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectModuleState(Base):
    __tablename__ = "project_module_states"
    __table_args__ = (
        CheckConstraint(
            "status IN ('not_started', 'current', 'stale', 'invalidated', 'blocked')",
            name="ck_project_module_states_status",
        ),
    )

    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    )
    module_key: Mapped[str] = mapped_column(String(80), primary_key=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="not_started"
    )
    reason: Mapped[str | None] = mapped_column(Text)
    trigger_entity_type: Mapped[str | None] = mapped_column(String(80))
    trigger_entity_id: Mapped[str | None] = mapped_column(String(36))
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    project: Mapped[Project] = relationship(back_populates="module_states")