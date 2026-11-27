from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ConceptCreate(BaseModel):
    code: str | None = Field(default=None, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    category: str | None = Field(default=None, max_length=120)
    description: str = Field(default="", max_length=10000)


class ConceptUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=10000)
    status: Literal["draft", "active", "archived"] | None = None


class ConceptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    code: str | None
    name: str
    category: str | None
    description: str
    status: str
    created_at: datetime
    updated_at: datetime


class VariantCreate(BaseModel):
    code: str | None = Field(default=None, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=10000)
    sort_order: int = 0


class VersionCreate(BaseModel):
    change_summary: str = Field(default="", max_length=5000)


class VersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    variant_id: str
    version_number: int
    based_on_version_id: str | None
    status: str
    change_summary: str
    created_at: datetime
    updated_at: datetime
    confirmed_at: datetime | None


class ProductDefinitionWrite(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    sku: str | None = Field(default=None, max_length=120)
    specification_summary: str = Field(default="", max_length=20000)
    category: str | None = Field(default=None, max_length=120)
    product_type: str | None = Field(default=None, max_length=120)
    priority: Literal["P0", "P1", "P2"] = "P1"
    planned_launch_date: date | None = None
    positioning: str = Field(default="", max_length=20000)
    market_entry: str = Field(default="", max_length=20000)
    target_price_min: Decimal | None = Field(default=None, ge=0)
    target_price_max: Decimal | None = Field(default=None, ge=0)
    target_price_currency: str = Field(default="USD", min_length=3, max_length=3)
    target_contribution: Decimal | None = Field(default=None, ge=0)
    pricing_strategy: str = Field(default="", max_length=10000)
    certification_requirements: str = Field(default="", max_length=10000)
    warranty_policy: str = Field(default="", max_length=5000)
    summary: str = Field(default="", max_length=20000)

    @model_validator(mode="after")
    def validate_price_range(self):
        if (
            self.target_price_min is not None
            and self.target_price_max is not None
            and self.target_price_min > self.target_price_max
        ):
            raise ValueError("target_price_min cannot exceed target_price_max")
        return self


class PersonaWrite(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    user_group: str = Field(min_length=1, max_length=160)
    age_range: str | None = Field(default=None, max_length=80)
    characteristics: str = Field(default="", max_length=10000)
    usage_scenario: str = Field(default="", max_length=10000)
    functional_needs: str = Field(default="", max_length=10000)
    emotional_needs: str = Field(default="", max_length=10000)
    social_needs: str = Field(default="", max_length=10000)
    pain_points: str = Field(default="", max_length=10000)
    purchase_decision_factors: str = Field(default="", max_length=10000)
    sort_order: int = 0


class RequirementWrite(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    requirement_type: str = Field(default="functional", max_length=40)
    title: str = Field(min_length=1, max_length=240)
    description: str = Field(default="", max_length=10000)
    target_value: str = Field(default="", max_length=5000)
    unit: str | None = Field(default=None, max_length=40)
    priority: Literal["P0", "P1", "P2"] = "P1"
    source_nature: str | None = Field(default=None, max_length=120)
    source_reference: str = Field(default="", max_length=5000)
    validation_method: str = Field(default="", max_length=5000)
    acceptance_criteria: str = Field(default="", max_length=5000)
    status: Literal["proposed", "confirmed", "validated", "blocked", "deferred"] = "proposed"
    sort_order: int = 0


class DevelopmentIssueWrite(BaseModel):
    issue_code: str | None = Field(default=None, max_length=40)
    title: str = Field(min_length=1, max_length=240)
    evidence_nature: str | None = Field(default=None, max_length=120)
    scenario: str = Field(default="", max_length=10000)
    development_action: str = Field(default="", max_length=10000)
    conclusion: str = Field(default="", max_length=10000)
    priority: Literal["P0", "P1", "P2"] = "P1"
    status: Literal["open", "in_progress", "resolved", "deferred"] = "open"
    sort_order: int = 0


class ExperienceStepWrite(BaseModel):
    sequence_no: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=200)
    user_action: str = Field(default="", max_length=5000)
    product_response: str = Field(default="", max_length=5000)
    sensory_feedback: str = Field(default="", max_length=5000)
    acceptance_criteria: str = Field(default="", max_length=5000)
    notes: str = Field(default="", max_length=5000)
    bom_item_codes: list[str] = Field(default_factory=list)


class ExperienceFlowWrite(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    purpose: str = Field(default="", max_length=5000)
    description: str = Field(default="", max_length=10000)
    sort_order: int = 0
    steps: list[ExperienceStepWrite] = Field(default_factory=list)


class BomQuoteWrite(BaseModel):
    supplier_name: str = Field(min_length=1, max_length=200)
    supplier_part_no: str | None = Field(default=None, max_length=120)
    quoted_unit_price: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    moq: int | None = Field(default=None, ge=0)
    lead_time_days: int | None = Field(default=None, ge=0)
    valid_until: date | None = None
    quote_status: Literal["candidate", "selected", "rejected", "expired"] = "candidate"
    source_file_id: str | None = None
    note: str = Field(default="", max_length=5000)


class BomItemWrite(BaseModel):
    item_code: str = Field(min_length=1, max_length=80)
    parent_item_code: str | None = Field(default=None, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    category: str | None = Field(default=None, max_length=100)
    specification: str = Field(default="", max_length=10000)
    material: str = Field(default="", max_length=5000)
    process: str = Field(default="", max_length=5000)
    quantity: Decimal = Field(default=Decimal("1"), ge=0)
    unit: str = Field(default="pcs", max_length=40)
    unit_cost_estimate: Decimal | None = Field(default=None, ge=0)
    estimate_currency: str = Field(default="USD", min_length=3, max_length=3)
    supplier_notes: str = Field(default="", max_length=5000)
    is_optional: bool = False
    sort_order: int = 0
    quotes: list[BomQuoteWrite] = Field(default_factory=list)


class QualityStandardWrite(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    requirement: str = Field(min_length=1, max_length=10000)
    test_method: str = Field(default="", max_length=5000)
    acceptance_criteria: str = Field(default="", max_length=5000)
    priority: Literal["P0", "P1", "P2"] = "P1"
    status: Literal["proposed", "confirmed", "verified", "blocked", "deferred"] = "proposed"
    source_reference: str = Field(default="", max_length=5000)
    sort_order: int = 0


class ProductRiskWrite(BaseModel):
    risk_type: Literal["market", "supply", "compliance", "operations", "product", "other"]
    title: str = Field(min_length=1, max_length=240)
    description: str = Field(default="", max_length=10000)
    likelihood: Literal["low", "medium", "high"] = "medium"
    impact: Literal["low", "medium", "high"] = "medium"
    mitigation: str = Field(default="", max_length=10000)
    owner: str | None = Field(default=None, max_length=120)
    status: Literal["open", "mitigating", "accepted", "closed"] = "open"
    sort_order: int = 0


class ConfirmVersionInput(BaseModel):
    decision_type: Literal["approve", "conditional", "hold", "reject", "continue"] = "approve"
    outcome: str = Field(default="确认产品定义版本", min_length=1, max_length=240)
    rationale: str = Field(default="", max_length=10000)
    impact: str = Field(default="", max_length=10000)
    conditions: str = Field(default="", max_length=10000)
