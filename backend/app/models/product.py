from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProductConcept(Base):
    __tablename__ = "product_concepts"
    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_product_concepts_project_name"),
        CheckConstraint(
            "status IN ('draft', 'active', 'archived')",
            name="ck_product_concepts_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str | None] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = (
        UniqueConstraint("concept_id", "name", name="uq_product_variants_concept_name"),
        CheckConstraint(
            "status IN ('active', 'archived')",
            name="ck_product_variants_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    concept_id: Mapped[str] = mapped_column(
        ForeignKey("product_concepts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str | None] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class VariantVersion(Base):
    __tablename__ = "variant_versions"
    __table_args__ = (
        UniqueConstraint("variant_id", "version_number", name="uq_variant_versions_number"),
        CheckConstraint(
            "status IN ('draft', 'confirmed', 'superseded')",
            name="ck_variant_versions_status",
        ),
        Index(
            "uq_variant_versions_single_draft",
            "variant_id",
            unique=True,
            sqlite_where=text("status = 'draft'"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    variant_id: Mapped[str] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    based_on_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    change_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ProductDefinition(Base):
    __tablename__ = "product_definitions"

    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(120))
    specification_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str | None] = mapped_column(String(120))
    product_type: Mapped[str | None] = mapped_column(String(120))
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="P1")
    planned_launch_date: Mapped[date | None] = mapped_column(Date)
    positioning: Mapped[str] = mapped_column(Text, nullable=False, default="")
    market_entry: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target_price_min: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    target_price_max: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    target_price_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    target_contribution: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    pricing_strategy: Mapped[str] = mapped_column(Text, nullable=False, default="")
    certification_requirements: Mapped[str] = mapped_column(Text, nullable=False, default="")
    warranty_policy: Mapped[str] = mapped_column(Text, nullable=False, default="")
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class ProductPersona(Base):
    __tablename__ = "product_personas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    user_group: Mapped[str] = mapped_column(String(160), nullable=False)
    age_range: Mapped[str | None] = mapped_column(String(80))
    characteristics: Mapped[str] = mapped_column(Text, nullable=False, default="")
    usage_scenario: Mapped[str] = mapped_column(Text, nullable=False, default="")
    functional_needs: Mapped[str] = mapped_column(Text, nullable=False, default="")
    emotional_needs: Mapped[str] = mapped_column(Text, nullable=False, default="")
    social_needs: Mapped[str] = mapped_column(Text, nullable=False, default="")
    pain_points: Mapped[str] = mapped_column(Text, nullable=False, default="")
    purchase_decision_factors: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProductRequirement(Base):
    __tablename__ = "product_requirements"
    __table_args__ = (
        UniqueConstraint("version_id", "code", name="uq_product_requirements_code"),
        CheckConstraint(
            "priority IN ('P0', 'P1', 'P2')",
            name="ck_product_requirements_priority",
        ),
        CheckConstraint(
            "status IN ('proposed', 'confirmed', 'validated', 'blocked', 'deferred')",
            name="ck_product_requirements_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    requirement_type: Mapped[str] = mapped_column(String(40), nullable=False, default="functional")
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target_value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    unit: Mapped[str | None] = mapped_column(String(40))
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="P1")
    source_nature: Mapped[str | None] = mapped_column(String(120))
    source_reference: Mapped[str] = mapped_column(Text, nullable=False, default="")
    validation_method: Mapped[str] = mapped_column(Text, nullable=False, default="")
    acceptance_criteria: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="proposed")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class DevelopmentIssue(Base):
    __tablename__ = "development_issues"
    __table_args__ = (
        CheckConstraint(
            "priority IN ('P0', 'P1', 'P2')",
            name="ck_development_issues_priority",
        ),
        CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'deferred')",
            name="ck_development_issues_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    issue_code: Mapped[str | None] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    evidence_nature: Mapped[str | None] = mapped_column(String(120))
    scenario: Mapped[str] = mapped_column(Text, nullable=False, default="")
    development_action: Mapped[str] = mapped_column(Text, nullable=False, default="")
    conclusion: Mapped[str] = mapped_column(Text, nullable=False, default="")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="P1")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ExperienceFlow(Base):
    __tablename__ = "experience_flows"
    __table_args__ = (UniqueConstraint("id", "version_id", name="uq_experience_flows_id_version"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ExperienceStep(Base):
    __tablename__ = "experience_steps"
    __table_args__ = (
        UniqueConstraint("id", "version_id", name="uq_experience_steps_id_version"),
        ForeignKeyConstraint(
            ["flow_id", "version_id"],
            ["experience_flows.id", "experience_flows.version_id"],
            ondelete="CASCADE",
            name="fk_experience_steps_flow_version",
        ),
        UniqueConstraint("flow_id", "sequence_no", name="uq_experience_steps_sequence"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    flow_id: Mapped[str] = mapped_column(String(36), nullable=False)
    version_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    user_action: Mapped[str] = mapped_column(Text, nullable=False, default="")
    product_response: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sensory_feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    acceptance_criteria: Mapped[str] = mapped_column(Text, nullable=False, default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")


class BomItem(Base):
    __tablename__ = "bom_items"
    __table_args__ = (
        UniqueConstraint("id", "version_id", name="uq_bom_items_id_version"),
        UniqueConstraint("version_id", "item_code", name="uq_bom_items_code"),
        ForeignKeyConstraint(
            ["parent_id", "version_id"],
            ["bom_items.id", "bom_items.version_id"],
            ondelete="CASCADE",
            name="fk_bom_items_parent_version",
        ),
        CheckConstraint("quantity >= 0", name="ck_bom_items_quantity_nonnegative"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[str | None] = mapped_column(String(36))
    item_code: Mapped[str | None] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    specification: Mapped[str] = mapped_column(Text, nullable=False, default="")
    material: Mapped[str] = mapped_column(Text, nullable=False, default="")
    process: Mapped[str] = mapped_column(Text, nullable=False, default="")
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=Decimal("1"))
    unit: Mapped[str] = mapped_column(String(40), nullable=False, default="pcs")
    unit_cost_estimate: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    estimate_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    supplier_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_optional: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ExperienceStepBomLink(Base):
    __tablename__ = "experience_step_bom_links"
    __table_args__ = (
        ForeignKeyConstraint(
            ["step_id", "version_id"],
            ["experience_steps.id", "experience_steps.version_id"],
            ondelete="CASCADE",
            name="fk_step_bom_link_step_version",
        ),
        ForeignKeyConstraint(
            ["bom_item_id", "version_id"],
            ["bom_items.id", "bom_items.version_id"],
            ondelete="CASCADE",
            name="fk_step_bom_link_bom_version",
        ),
    )

    step_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    bom_item_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(String(36), nullable=False)


class BomItemQuote(Base):
    __tablename__ = "bom_item_quotes"
    __table_args__ = (
        ForeignKeyConstraint(
            ["bom_item_id", "version_id"],
            ["bom_items.id", "bom_items.version_id"],
            ondelete="CASCADE",
            name="fk_bom_item_quotes_item_version",
        ),
        CheckConstraint(
            "quote_status IN ('candidate', 'selected', 'rejected', 'expired')",
            name="ck_bom_item_quotes_status",
        ),
        CheckConstraint("moq IS NULL OR moq >= 0", name="ck_bom_item_quotes_moq"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    bom_item_id: Mapped[str] = mapped_column(String(36), nullable=False)
    version_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    supplier_name: Mapped[str] = mapped_column(String(200), nullable=False)
    supplier_part_no: Mapped[str | None] = mapped_column(String(120))
    quoted_unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    moq: Mapped[int | None] = mapped_column(Integer)
    lead_time_days: Mapped[int | None] = mapped_column(Integer)
    valid_until: Mapped[date | None] = mapped_column(Date)
    quote_status: Mapped[str] = mapped_column(String(20), nullable=False, default="candidate")
    source_file_id: Mapped[str | None] = mapped_column(ForeignKey("files.id", ondelete="SET NULL"))
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class QualityStandard(Base):
    __tablename__ = "quality_standards"
    __table_args__ = (
        CheckConstraint("priority IN ('P0', 'P1', 'P2')", name="ck_quality_standards_priority"),
        CheckConstraint(
            "status IN ('proposed', 'confirmed', 'verified', 'blocked', 'deferred')",
            name="ck_quality_standards_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    requirement: Mapped[str] = mapped_column(Text, nullable=False)
    test_method: Mapped[str] = mapped_column(Text, nullable=False, default="")
    acceptance_criteria: Mapped[str] = mapped_column(Text, nullable=False, default="")
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="P1")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="proposed")
    source_reference: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProductRisk(Base):
    __tablename__ = "product_risks"
    __table_args__ = (
        CheckConstraint(
            "risk_type IN ('market', 'supply', 'compliance', 'operations', 'product', 'other')",
            name="ck_product_risks_type",
        ),
        CheckConstraint("likelihood IN ('low', 'medium', 'high')", name="ck_product_risks_likelihood"),
        CheckConstraint("impact IN ('low', 'medium', 'high')", name="ck_product_risks_impact"),
        CheckConstraint(
            "status IN ('open', 'mitigating', 'accepted', 'closed')",
            name="ck_product_risks_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    risk_type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    likelihood: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    impact: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    mitigation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    owner: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Decision(Base):
    __tablename__ = "decisions"
    __table_args__ = (
        CheckConstraint(
            "decision_type IN ('approve', 'conditional', 'hold', 'reject', 'continue')",
            name="ck_decisions_type",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage: Mapped[str] = mapped_column(String(80), nullable=False, default="product_definition")
    decision_type: Mapped[str] = mapped_column(String(20), nullable=False)
    outcome: Mapped[str] = mapped_column(String(240), nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False, default="")
    impact: Mapped[str] = mapped_column(Text, nullable=False, default="")
    conditions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DecisionVersionLink(Base):
    __tablename__ = "decision_version_links"

    decision_id: Mapped[str] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        primary_key=True,
    )


class ProductAsset(Base):
    __tablename__ = "product_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    version_id: Mapped[str] = mapped_column(
        ForeignKey("variant_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[str] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_role: Mapped[str] = mapped_column(String(80), nullable=False, default="reference")
    caption: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
