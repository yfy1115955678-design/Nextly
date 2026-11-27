"""Create Nextly 3.0 M0 foundation tables.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-27
"""
from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("target_market", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('active', 'paused', 'archived')",
            name="ck_projects_status",
        ),
    )
    op.create_table(
        "project_module_states",
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("module_key", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="not_started"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("trigger_entity_type", sa.String(length=80), nullable=True),
        sa.Column("trigger_entity_id", sa.String(length=36), nullable=True),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('not_started', 'current', 'stale', 'invalidated', 'blocked')",
            name="ck_project_module_states_status",
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("project_id", "module_key"),
    )
    op.create_table(
        "files",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=36), nullable=True),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("stored_rel_path", sa.String(length=600), nullable=False, unique=True),
        sa.Column("mime_type", sa.String(length=160), nullable=True),
        sa.Column("extension", sa.String(length=20), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sha256", sa.String(length=64), nullable=True),
        sa.Column("file_kind", sa.String(length=40), nullable=False, server_default="other"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_files_project_id", "files", ["project_id"])
    op.create_table(
        "app_settings",
        sa.Column("setting_key", sa.String(length=120), primary_key=True),
        sa.Column("value_json", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("json_valid(value_json)", name="ck_app_settings_valid_json"),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
    op.drop_index("ix_files_project_id", table_name="files")
    op.drop_table("files")
    op.drop_table("project_module_states")
    op.drop_table("projects")