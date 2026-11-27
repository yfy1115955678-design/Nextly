"""Add versioned product-definition domain.

Revision ID: 0002_product_definition
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa


revision = "0002_product_definition"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_concepts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('draft', 'active', 'archived')", name="ck_product_concepts_status"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "name", name="uq_product_concepts_project_name"),
    )
    op.create_index("ix_product_concepts_project_id", "product_concepts", ["project_id"])

    op.create_table(
        "product_variants",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("concept_id", sa.String(length=36), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('active', 'archived')", name="ck_product_variants_status"),
        sa.ForeignKeyConstraint(["concept_id"], ["product_concepts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("concept_id", "name", name="uq_product_variants_concept_name"),
    )
    op.create_index("ix_product_variants_concept_id", "product_variants", ["concept_id"])

    op.create_table(
        "variant_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("variant_id", sa.String(length=36), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("based_on_version_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("change_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft', 'confirmed', 'superseded')", name="ck_variant_versions_status"),
        sa.ForeignKeyConstraint(["based_on_version_id"], ["variant_versions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("variant_id", "version_number", name="uq_variant_versions_number"),
    )
    op.create_index("ix_variant_versions_variant_id", "variant_versions", ["variant_id"])
    op.create_index(
        "uq_variant_versions_single_draft",
        "variant_versions",
        ["variant_id"],
        unique=True,
        sqlite_where=sa.text("status = 'draft'"),
    )

    op.create_table(
        "product_definitions",
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("product_name", sa.String(length=200), nullable=False),
        sa.Column("sku", sa.String(length=120), nullable=True),
        sa.Column("specification_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("product_type", sa.String(length=120), nullable=True),
        sa.Column("priority", sa.String(length=10), nullable=False, server_default="P1"),
        sa.Column("planned_launch_date", sa.Date(), nullable=True),
        sa.Column("positioning", sa.Text(), nullable=False, server_default=""),
        sa.Column("market_entry", sa.Text(), nullable=False, server_default=""),
        sa.Column("target_price_min", sa.Numeric(12, 2), nullable=True),
        sa.Column("target_price_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("target_price_currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("target_contribution", sa.Numeric(12, 2), nullable=True),
        sa.Column("pricing_strategy", sa.Text(), nullable=False, server_default=""),
        sa.Column("certification_requirements", sa.Text(), nullable=False, server_default=""),
        sa.Column("warranty_policy", sa.Text(), nullable=False, server_default=""),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("version_id"),
    )

    op.create_table(
        "product_personas",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("user_group", sa.String(length=160), nullable=False),
        sa.Column("age_range", sa.String(length=80), nullable=True),
        sa.Column("characteristics", sa.Text(), nullable=False, server_default=""),
        sa.Column("usage_scenario", sa.Text(), nullable=False, server_default=""),
        sa.Column("functional_needs", sa.Text(), nullable=False, server_default=""),
        sa.Column("emotional_needs", sa.Text(), nullable=False, server_default=""),
        sa.Column("social_needs", sa.Text(), nullable=False, server_default=""),
        sa.Column("pain_points", sa.Text(), nullable=False, server_default=""),
        sa.Column("purchase_decision_factors", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_personas_version_id", "product_personas", ["version_id"])

    op.create_table(
        "product_requirements",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("requirement_type", sa.String(length=40), nullable=False, server_default="functional"),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("target_value", sa.Text(), nullable=False, server_default=""),
        sa.Column("unit", sa.String(length=40), nullable=True),
        sa.Column("priority", sa.String(length=10), nullable=False, server_default="P1"),
        sa.Column("source_nature", sa.String(length=120), nullable=True),
        sa.Column("source_reference", sa.Text(), nullable=False, server_default=""),
        sa.Column("validation_method", sa.Text(), nullable=False, server_default=""),
        sa.Column("acceptance_criteria", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="proposed"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("priority IN ('P0', 'P1', 'P2')", name="ck_product_requirements_priority"),
        sa.CheckConstraint("status IN ('proposed', 'confirmed', 'validated', 'blocked', 'deferred')", name="ck_product_requirements_status"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("version_id", "code", name="uq_product_requirements_code"),
    )
    op.create_index("ix_product_requirements_version_id", "product_requirements", ["version_id"])

    op.create_table(
        "development_issues",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("issue_code", sa.String(length=40), nullable=True),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("evidence_nature", sa.String(length=120), nullable=True),
        sa.Column("scenario", sa.Text(), nullable=False, server_default=""),
        sa.Column("development_action", sa.Text(), nullable=False, server_default=""),
        sa.Column("conclusion", sa.Text(), nullable=False, server_default=""),
        sa.Column("priority", sa.String(length=10), nullable=False, server_default="P1"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("priority IN ('P0', 'P1', 'P2')", name="ck_development_issues_priority"),
        sa.CheckConstraint("status IN ('open', 'in_progress', 'resolved', 'deferred')", name="ck_development_issues_status"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_development_issues_version_id", "development_issues", ["version_id"])

    op.create_table(
        "experience_flows",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id", "version_id", name="uq_experience_flows_id_version"),
    )
    op.create_index("ix_experience_flows_version_id", "experience_flows", ["version_id"])

    op.create_table(
        "bom_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("parent_id", sa.String(length=36), nullable=True),
        sa.Column("item_code", sa.String(length=80), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("specification", sa.Text(), nullable=False, server_default=""),
        sa.Column("material", sa.Text(), nullable=False, server_default=""),
        sa.Column("process", sa.Text(), nullable=False, server_default=""),
        sa.Column("quantity", sa.Numeric(12, 4), nullable=False, server_default="1"),
        sa.Column("unit", sa.String(length=40), nullable=False, server_default="pcs"),
        sa.Column("unit_cost_estimate", sa.Numeric(12, 4), nullable=True),
        sa.Column("estimate_currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("supplier_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("is_optional", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("quantity >= 0", name="ck_bom_items_quantity_nonnegative"),
        sa.ForeignKeyConstraint(["parent_id", "version_id"], ["bom_items.id", "bom_items.version_id"], ondelete="CASCADE", name="fk_bom_items_parent_version"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id", "version_id", name="uq_bom_items_id_version"),
        sa.UniqueConstraint("version_id", "item_code", name="uq_bom_items_code"),
    )
    op.create_index("ix_bom_items_version_id", "bom_items", ["version_id"])

    op.create_table(
        "experience_steps",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("flow_id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("user_action", sa.Text(), nullable=False, server_default=""),
        sa.Column("product_response", sa.Text(), nullable=False, server_default=""),
        sa.Column("sensory_feedback", sa.Text(), nullable=False, server_default=""),
        sa.Column("acceptance_criteria", sa.Text(), nullable=False, server_default=""),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.ForeignKeyConstraint(["flow_id", "version_id"], ["experience_flows.id", "experience_flows.version_id"], ondelete="CASCADE", name="fk_experience_steps_flow_version"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id", "version_id", name="uq_experience_steps_id_version"),
        sa.UniqueConstraint("flow_id", "sequence_no", name="uq_experience_steps_sequence"),
    )
    op.create_index("ix_experience_steps_version_id", "experience_steps", ["version_id"])

    op.create_table(
        "experience_step_bom_links",
        sa.Column("step_id", sa.String(length=36), nullable=False),
        sa.Column("bom_item_id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["bom_item_id", "version_id"], ["bom_items.id", "bom_items.version_id"], ondelete="CASCADE", name="fk_step_bom_link_bom_version"),
        sa.ForeignKeyConstraint(["step_id", "version_id"], ["experience_steps.id", "experience_steps.version_id"], ondelete="CASCADE", name="fk_step_bom_link_step_version"),
        sa.PrimaryKeyConstraint("step_id", "bom_item_id"),
    )

    op.create_table(
        "bom_item_quotes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("bom_item_id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("supplier_name", sa.String(length=200), nullable=False),
        sa.Column("supplier_part_no", sa.String(length=120), nullable=True),
        sa.Column("quoted_unit_price", sa.Numeric(12, 4), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("moq", sa.Integer(), nullable=True),
        sa.Column("lead_time_days", sa.Integer(), nullable=True),
        sa.Column("valid_until", sa.Date(), nullable=True),
        sa.Column("quote_status", sa.String(length=20), nullable=False, server_default="candidate"),
        sa.Column("source_file_id", sa.String(length=36), nullable=True),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("quote_status IN ('candidate', 'selected', 'rejected', 'expired')", name="ck_bom_item_quotes_status"),
        sa.CheckConstraint("moq IS NULL OR moq >= 0", name="ck_bom_item_quotes_moq"),
        sa.ForeignKeyConstraint(["bom_item_id", "version_id"], ["bom_items.id", "bom_items.version_id"], ondelete="CASCADE", name="fk_bom_item_quotes_item_version"),
        sa.ForeignKeyConstraint(["source_file_id"], ["files.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bom_item_quotes_version_id", "bom_item_quotes", ["version_id"])

    op.create_table(
        "quality_standards",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("requirement", sa.Text(), nullable=False),
        sa.Column("test_method", sa.Text(), nullable=False, server_default=""),
        sa.Column("acceptance_criteria", sa.Text(), nullable=False, server_default=""),
        sa.Column("priority", sa.String(length=10), nullable=False, server_default="P1"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="proposed"),
        sa.Column("source_reference", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("priority IN ('P0', 'P1', 'P2')", name="ck_quality_standards_priority"),
        sa.CheckConstraint("status IN ('proposed', 'confirmed', 'verified', 'blocked', 'deferred')", name="ck_quality_standards_status"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quality_standards_version_id", "quality_standards", ["version_id"])

    op.create_table(
        "product_risks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("risk_type", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("likelihood", sa.String(length=10), nullable=False, server_default="medium"),
        sa.Column("impact", sa.String(length=10), nullable=False, server_default="medium"),
        sa.Column("mitigation", sa.Text(), nullable=False, server_default=""),
        sa.Column("owner", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("risk_type IN ('market', 'supply', 'compliance', 'operations', 'product', 'other')", name="ck_product_risks_type"),
        sa.CheckConstraint("likelihood IN ('low', 'medium', 'high')", name="ck_product_risks_likelihood"),
        sa.CheckConstraint("impact IN ('low', 'medium', 'high')", name="ck_product_risks_impact"),
        sa.CheckConstraint("status IN ('open', 'mitigating', 'accepted', 'closed')", name="ck_product_risks_status"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_risks_version_id", "product_risks", ["version_id"])

    op.create_table(
        "decisions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("project_id", sa.String(length=36), nullable=False),
        sa.Column("stage", sa.String(length=80), nullable=False, server_default="product_definition"),
        sa.Column("decision_type", sa.String(length=20), nullable=False),
        sa.Column("outcome", sa.String(length=240), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False, server_default=""),
        sa.Column("impact", sa.Text(), nullable=False, server_default=""),
        sa.Column("conditions", sa.Text(), nullable=False, server_default=""),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("decision_type IN ('approve', 'conditional', 'hold', 'reject', 'continue')", name="ck_decisions_type"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_decisions_project_id", "decisions", ["project_id"])

    op.create_table(
        "decision_version_links",
        sa.Column("decision_id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("decision_id", "version_id"),
    )

    op.create_table(
        "product_assets",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("file_id", sa.String(length=36), nullable=False),
        sa.Column("asset_role", sa.String(length=80), nullable=False, server_default="reference"),
        sa.Column("caption", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["variant_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_assets_version_id", "product_assets", ["version_id"])
    op.create_index("ix_product_assets_file_id", "product_assets", ["file_id"])


def downgrade() -> None:
    op.drop_index("ix_product_assets_file_id", table_name="product_assets")
    op.drop_index("ix_product_assets_version_id", table_name="product_assets")
    op.drop_table("product_assets")
    op.drop_table("decision_version_links")
    op.drop_index("ix_decisions_project_id", table_name="decisions")
    op.drop_table("decisions")
    op.drop_index("ix_product_risks_version_id", table_name="product_risks")
    op.drop_table("product_risks")
    op.drop_index("ix_quality_standards_version_id", table_name="quality_standards")
    op.drop_table("quality_standards")
    op.drop_index("ix_bom_item_quotes_version_id", table_name="bom_item_quotes")
    op.drop_table("bom_item_quotes")
    op.drop_table("experience_step_bom_links")
    op.drop_index("ix_experience_steps_version_id", table_name="experience_steps")
    op.drop_table("experience_steps")
    op.drop_index("ix_bom_items_version_id", table_name="bom_items")
    op.drop_table("bom_items")
    op.drop_index("ix_experience_flows_version_id", table_name="experience_flows")
    op.drop_table("experience_flows")
    op.drop_index("ix_development_issues_version_id", table_name="development_issues")
    op.drop_table("development_issues")
    op.drop_index("ix_product_requirements_version_id", table_name="product_requirements")
    op.drop_table("product_requirements")
    op.drop_index("ix_product_personas_version_id", table_name="product_personas")
    op.drop_table("product_personas")
    op.drop_table("product_definitions")
    op.drop_index("uq_variant_versions_single_draft", table_name="variant_versions")
    op.drop_index("ix_variant_versions_variant_id", table_name="variant_versions")
    op.drop_table("variant_versions")
    op.drop_index("ix_product_variants_concept_id", table_name="product_variants")
    op.drop_table("product_variants")
    op.drop_index("ix_product_concepts_project_id", table_name="product_concepts")
    op.drop_table("product_concepts")
