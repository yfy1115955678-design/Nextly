from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi.encoders import jsonable_encoder
from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.file_asset import FileAsset
from app.models.product import (
    BomItem,
    BomItemQuote,
    Decision,
    DecisionVersionLink,
    DevelopmentIssue,
    ExperienceFlow,
    ExperienceStep,
    ExperienceStepBomLink,
    ProductAsset,
    ProductConcept,
    ProductDefinition,
    ProductPersona,
    ProductRequirement,
    ProductRisk,
    ProductVariant,
    QualityStandard,
    VariantVersion,
)
from app.models.project import Project


def _id() -> str:
    return str(uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _require_project(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == "archived":
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _require_concept(db: Session, concept_id: str) -> ProductConcept:
    concept = db.get(ProductConcept, concept_id)
    if concept is None or concept.status == "archived":
        raise HTTPException(status_code=404, detail="Concept not found")
    _require_project(db, concept.project_id)
    return concept


def _require_variant(db: Session, variant_id: str) -> ProductVariant:
    variant = db.get(ProductVariant, variant_id)
    if variant is None or variant.status == "archived":
        raise HTTPException(status_code=404, detail="Variant not found")
    _require_concept(db, variant.concept_id)
    return variant


def _require_version(db: Session, version_id: str) -> VariantVersion:
    version = db.get(VariantVersion, version_id)
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


def _require_draft(db: Session, version_id: str) -> VariantVersion:
    version = _require_version(db, version_id)
    if version.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Confirmed and superseded Versions are read-only. Create a new Draft to edit.",
        )
    return version


def _copy_columns(record, excluded: set[str]) -> dict:
    return {
        column.name: getattr(record, column.name)
        for column in record.__table__.columns
        if column.name not in excluded
    }


def list_concepts(db: Session, project_id: str) -> list[ProductConcept]:
    _require_project(db, project_id)
    statement = (
        select(ProductConcept)
        .where(ProductConcept.project_id == project_id)
        .where(ProductConcept.status != "archived")
        .order_by(ProductConcept.updated_at.desc())
    )
    return list(db.scalars(statement).all())


def create_concept(db: Session, project_id: str, payload) -> ProductConcept:
    _require_project(db, project_id)
    concept = ProductConcept(
        id=_id(),
        project_id=project_id,
        code=payload.code,
        name=payload.name.strip(),
        category=payload.category,
        description=payload.description,
        status="draft",
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(concept)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(concept)
    return concept


def get_concept(db: Session, concept_id: str) -> ProductConcept:
    return _require_concept(db, concept_id)


def update_concept(db: Session, concept_id: str, payload) -> ProductConcept:
    concept = _require_concept(db, concept_id)
    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates:
        updates["name"] = (updates["name"] or "").strip()
        if not updates["name"]:
            raise HTTPException(status_code=422, detail="Concept name is required")
    for key, value in updates.items():
        setattr(concept, key, value)
    concept.updated_at = _now()
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(concept)
    return concept


def list_variants(db: Session, concept_id: str) -> list[ProductVariant]:
    _require_concept(db, concept_id)
    statement = (
        select(ProductVariant)
        .where(ProductVariant.concept_id == concept_id)
        .where(ProductVariant.status != "archived")
        .order_by(ProductVariant.sort_order, ProductVariant.created_at)
    )
    return list(db.scalars(statement).all())


def create_variant(db: Session, concept_id: str, payload) -> ProductVariant:
    _require_concept(db, concept_id)
    variant = ProductVariant(
        id=_id(),
        concept_id=concept_id,
        code=payload.code,
        name=payload.name.strip(),
        description=payload.description,
        sort_order=payload.sort_order,
        status="active",
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(variant)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(variant)
    return variant


def get_variant_detail(db: Session, variant_id: str) -> dict:
    variant = _require_variant(db, variant_id)
    versions = list(
        db.scalars(
            select(VariantVersion)
            .where(VariantVersion.variant_id == variant_id)
            .order_by(VariantVersion.version_number.desc())
        ).all()
    )
    return jsonable_encoder({"variant": variant, "versions": versions})


def _clone_version_content(db: Session, source: VariantVersion, target: VariantVersion) -> None:
    source_id = source.id
    target_id = target.id

    definition = db.get(ProductDefinition, source_id)
    if definition:
        db.add(ProductDefinition(
            version_id=target_id,
            **_copy_columns(definition, {"version_id", "updated_at"}),
            updated_at=_now(),
        ))

    for model in (ProductPersona, ProductRequirement, DevelopmentIssue, QualityStandard, ProductRisk):
        records = list(db.scalars(select(model).where(model.version_id == source_id)).all())
        for record in records:
            db.add(model(
                id=_id(),
                version_id=target_id,
                **_copy_columns(record, {"id", "version_id"}),
            ))

    source_flows = list(
        db.scalars(
            select(ExperienceFlow)
            .where(ExperienceFlow.version_id == source_id)
            .order_by(ExperienceFlow.sort_order)
        ).all()
    )
    flow_ids: dict[str, str] = {}
    step_ids: dict[str, str] = {}
    for flow in source_flows:
        new_flow_id = _id()
        flow_ids[flow.id] = new_flow_id
        db.add(ExperienceFlow(
            id=new_flow_id,
            version_id=target_id,
            **_copy_columns(flow, {"id", "version_id"}),
        ))
        source_steps = list(
            db.scalars(
                select(ExperienceStep)
                .where(ExperienceStep.flow_id == flow.id)
                .order_by(ExperienceStep.sequence_no)
            ).all()
        )
        for step in source_steps:
            new_step_id = _id()
            step_ids[step.id] = new_step_id
            db.add(ExperienceStep(
                id=new_step_id,
                flow_id=new_flow_id,
                version_id=target_id,
                **_copy_columns(step, {"id", "flow_id", "version_id"}),
            ))

    source_bom = list(
        db.scalars(
            select(BomItem)
            .where(BomItem.version_id == source_id)
            .order_by(BomItem.sort_order)
        ).all()
    )
    bom_ids = {item.id: _id() for item in source_bom}
    for item in source_bom:
        db.add(BomItem(
            id=bom_ids[item.id],
            version_id=target_id,
            parent_id=None,
            **_copy_columns(item, {"id", "version_id", "parent_id"}),
        ))
    db.flush()

    for item in source_bom:
        if item.parent_id:
            db.get(BomItem, bom_ids[item.id]).parent_id = bom_ids[item.parent_id]

        quotes = list(
            db.scalars(
                select(BomItemQuote).where(BomItemQuote.bom_item_id == item.id)
            ).all()
        )
        for quote in quotes:
            db.add(BomItemQuote(
                id=_id(),
                bom_item_id=bom_ids[item.id],
                version_id=target_id,
                **_copy_columns(quote, {"id", "bom_item_id", "version_id"}),
            ))

    source_links = list(
        db.scalars(
            select(ExperienceStepBomLink).where(
                ExperienceStepBomLink.version_id == source_id
            )
        ).all()
    )
    for link in source_links:
        if link.step_id in step_ids and link.bom_item_id in bom_ids:
            db.add(ExperienceStepBomLink(
                step_id=step_ids[link.step_id],
                bom_item_id=bom_ids[link.bom_item_id],
                version_id=target_id,
            ))

    assets = list(
        db.scalars(select(ProductAsset).where(ProductAsset.version_id == source_id)).all()
    )
    for asset in assets:
        db.add(ProductAsset(
            id=_id(),
            version_id=target_id,
            **_copy_columns(asset, {"id", "version_id"}),
        ))


def create_version(db: Session, variant_id: str, payload) -> VariantVersion:
    _require_variant(db, variant_id)
    existing = list(
        db.scalars(
            select(VariantVersion)
            .where(VariantVersion.variant_id == variant_id)
            .order_by(VariantVersion.version_number.desc())
        ).all()
    )
    if any(version.status == "draft" for version in existing):
        raise HTTPException(
            status_code=409,
            detail="This Variant already has an editable Draft Version.",
        )

    latest = existing[0] if existing else None
    version = VariantVersion(
        id=_id(),
        variant_id=variant_id,
        version_number=(latest.version_number + 1) if latest else 1,
        based_on_version_id=latest.id if latest else None,
        status="draft",
        change_summary=payload.change_summary,
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(version)
    db.flush()
    if latest:
        _clone_version_content(db, latest, version)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(version)
    return version


def get_version_detail(db: Session, version_id: str) -> dict:
    version = _require_version(db, version_id)
    variant = _require_variant(db, version.variant_id)
    concept = _require_concept(db, variant.concept_id)
    project = _require_project(db, concept.project_id)

    definition = db.get(ProductDefinition, version_id)
    personas = list(db.scalars(select(ProductPersona).where(ProductPersona.version_id == version_id).order_by(ProductPersona.sort_order)).all())
    requirements = list(db.scalars(select(ProductRequirement).where(ProductRequirement.version_id == version_id).order_by(ProductRequirement.sort_order)).all())
    issues = list(db.scalars(select(DevelopmentIssue).where(DevelopmentIssue.version_id == version_id).order_by(DevelopmentIssue.sort_order)).all())
    flows = list(db.scalars(select(ExperienceFlow).where(ExperienceFlow.version_id == version_id).order_by(ExperienceFlow.sort_order)).all())
    bom_items = list(db.scalars(select(BomItem).where(BomItem.version_id == version_id).order_by(BomItem.sort_order)).all())
    bom_by_id = {item.id: item for item in bom_items}
    bom_by_code = {item.item_code: item for item in bom_items if item.item_code}

    flow_details = []
    for flow in flows:
        steps = list(db.scalars(select(ExperienceStep).where(ExperienceStep.flow_id == flow.id).order_by(ExperienceStep.sequence_no)).all())
        step_details = []
        for step in steps:
            links = list(db.scalars(select(ExperienceStepBomLink).where(ExperienceStepBomLink.step_id == step.id)).all())
            step_details.append({
                "step": step,
                "bom_item_codes": [
                    bom_by_id[link.bom_item_id].item_code
                    for link in links
                    if link.bom_item_id in bom_by_id
                ],
            })
        flow_details.append({"flow": flow, "steps": step_details})

    bom_details = []
    for item in bom_items:
        quotes = list(db.scalars(select(BomItemQuote).where(BomItemQuote.bom_item_id == item.id)).all())
        parent = bom_by_id.get(item.parent_id) if item.parent_id else None
        bom_details.append({
            "item": item,
            "parent_item_code": parent.item_code if parent else None,
            "quotes": quotes,
        })

    quality_standards = list(db.scalars(select(QualityStandard).where(QualityStandard.version_id == version_id).order_by(QualityStandard.sort_order)).all())
    risks = list(db.scalars(select(ProductRisk).where(ProductRisk.version_id == version_id).order_by(ProductRisk.sort_order)).all())
    assets = list(db.scalars(select(ProductAsset).where(ProductAsset.version_id == version_id).order_by(ProductAsset.sort_order)).all())
    decisions = list(
        db.scalars(
            select(Decision)
            .join(DecisionVersionLink, DecisionVersionLink.decision_id == Decision.id)
            .where(DecisionVersionLink.version_id == version_id)
            .order_by(Decision.decided_at.desc())
        ).all()
    )

    return jsonable_encoder({
        "project": project,
        "concept": concept,
        "variant": variant,
        "version": version,
        "definition": definition,
        "personas": personas,
        "requirements": requirements,
        "development_issues": issues,
        "experience_flows": flow_details,
        "bom_items": bom_details,
        "quality_standards": quality_standards,
        "risks": risks,
        "assets": assets,
        "decisions": decisions,
    })


def save_definition(db: Session, version_id: str, payload) -> dict:
    _require_draft(db, version_id)
    definition = db.get(ProductDefinition, version_id)
    values = payload.model_dump()
    if definition is None:
        definition = ProductDefinition(version_id=version_id, **values, updated_at=_now())
        db.add(definition)
    else:
        for key, value in values.items():
            setattr(definition, key, value)
        definition.updated_at = _now()
    db.commit()
    db.refresh(definition)
    return jsonable_encoder(definition)


def _replace_version_records(db: Session, version_id: str, model, payloads) -> list:
    _require_draft(db, version_id)
    db.execute(delete(model).where(model.version_id == version_id))
    records = []
    for index, payload in enumerate(payloads):
        values = payload.model_dump()
        if "sort_order" not in values:
            values["sort_order"] = index
        record = model(id=_id(), version_id=version_id, **values)
        records.append(record)
        db.add(record)
    db.commit()
    return records


def replace_personas(db: Session, version_id: str, payloads) -> list:
    return _replace_version_records(db, version_id, ProductPersona, payloads)


def replace_requirements(db: Session, version_id: str, payloads) -> list:
    codes = [payload.code for payload in payloads]
    if len(codes) != len(set(codes)):
        raise HTTPException(status_code=422, detail="Requirement codes must be unique within a Version.")
    return _replace_version_records(db, version_id, ProductRequirement, payloads)


def replace_development_issues(db: Session, version_id: str, payloads) -> list:
    return _replace_version_records(db, version_id, DevelopmentIssue, payloads)


def replace_quality_standards(db: Session, version_id: str, payloads) -> list:
    return _replace_version_records(db, version_id, QualityStandard, payloads)


def replace_risks(db: Session, version_id: str, payloads) -> list:
    return _replace_version_records(db, version_id, ProductRisk, payloads)


def replace_bom(db: Session, version_id: str, payloads) -> list:
    version = _require_draft(db, version_id)
    variant = _require_variant(db, version.variant_id)
    concept = _require_concept(db, variant.concept_id)
    codes = [payload.item_code for payload in payloads]
    if len(codes) != len(set(codes)):
        raise HTTPException(status_code=422, detail="BOM item codes must be unique within a Version.")
    code_set = set(codes)
    parent_map = {payload.item_code: payload.parent_item_code for payload in payloads}
    for code, parent_code in parent_map.items():
        if parent_code and parent_code not in code_set:
            raise HTTPException(status_code=422, detail=f"BOM parent item not found: {parent_code}")
        if parent_code == code:
            raise HTTPException(status_code=422, detail=f"BOM item cannot be its own parent: {code}")
        visited = {code}
        current = parent_code
        while current:
            if current in visited:
                raise HTTPException(status_code=422, detail="BOM hierarchy contains a cycle.")
            visited.add(current)
            current = parent_map.get(current)

    # Preserve the user's experience-to-material relationships when the BOM is saved.
    # The write API replaces rows; capture semantic keys before the cascade deletes links.
    existing_links = db.execute(
        select(ExperienceStepBomLink.step_id, BomItem.item_code)
        .join(BomItem, BomItem.id == ExperienceStepBomLink.bom_item_id)
        .where(ExperienceStepBomLink.version_id == version_id)
    ).all()
    removed_linked = sorted({code for _, code in existing_links if code not in code_set}, key=str)
    if removed_linked:
        raise HTTPException(
            status_code=409,
            detail="请先在体验流程中解除以下物料关联，再删除或更改物料编码：" + ", ".join(str(code) for code in removed_linked),
        )

    db.execute(delete(BomItem).where(BomItem.version_id == version_id))
    items = []
    for payload in payloads:
        values = payload.model_dump(exclude={"parent_item_code", "quotes"})
        item = BomItem(
            id=_id(),
            version_id=version_id,
            parent_id=None,
            **values,
        )
        items.append((item, payload))
        db.add(item)
    db.flush()

    by_code = {item.item_code: item for item, _ in items}
    for item, payload in items:
        if payload.parent_item_code:
            item.parent_id = by_code[payload.parent_item_code].id
        for quote_payload in payload.quotes:
            quote_values = quote_payload.model_dump()
            source_file_id = quote_values.get("source_file_id")
            if source_file_id:
                asset = db.get(FileAsset, source_file_id)
                if asset is None or asset.project_id != concept.project_id:
                    raise HTTPException(
                        status_code=422,
                        detail="Supplier quote source file must belong to this Project.",
                    )
            db.add(BomItemQuote(
                id=_id(),
                bom_item_id=item.id,
                version_id=version_id,
                **quote_values,
            ))

    for step_id, code in existing_links:
        db.add(ExperienceStepBomLink(
            step_id=step_id,
            bom_item_id=by_code[code].id,
            version_id=version_id,
        ))

    db.commit()
    return [item for item, _ in items]


def replace_experience_flows(db: Session, version_id: str, payloads) -> list:
    _require_draft(db, version_id)
    bom_items = list(db.scalars(select(BomItem).where(BomItem.version_id == version_id)).all())
    bom_by_code = {item.item_code: item for item in bom_items if item.item_code}

    for flow in payloads:
        step_numbers = [step.sequence_no for step in flow.steps]
        if len(step_numbers) != len(set(step_numbers)):
            raise HTTPException(status_code=422, detail="Experience step sequence numbers must be unique within a flow.")
        for step in flow.steps:
            unknown = [code for code in step.bom_item_codes if code not in bom_by_code]
            if unknown:
                raise HTTPException(status_code=422, detail="Experience step references a BOM item outside this Version: " + ", ".join(unknown))

    db.execute(delete(ExperienceFlow).where(ExperienceFlow.version_id == version_id))
    flows = []
    for flow_payload in payloads:
        flow = ExperienceFlow(
            id=_id(),
            version_id=version_id,
            name=flow_payload.name,
            purpose=flow_payload.purpose,
            description=flow_payload.description,
            sort_order=flow_payload.sort_order,
        )
        db.add(flow)
        flows.append(flow)
        db.flush()

        for step_payload in flow_payload.steps:
            step = ExperienceStep(
                id=_id(),
                flow_id=flow.id,
                version_id=version_id,
                sequence_no=step_payload.sequence_no,
                title=step_payload.title,
                user_action=step_payload.user_action,
                product_response=step_payload.product_response,
                sensory_feedback=step_payload.sensory_feedback,
                acceptance_criteria=step_payload.acceptance_criteria,
                notes=step_payload.notes,
            )
            db.add(step)
            db.flush()
            for item_code in step_payload.bom_item_codes:
                db.add(ExperienceStepBomLink(
                    step_id=step.id,
                    bom_item_id=bom_by_code[item_code].id,
                    version_id=version_id,
                ))

    db.commit()
    return flows


def confirm_version(db: Session, version_id: str, payload) -> dict:
    version = _require_draft(db, version_id)
    definition = db.get(ProductDefinition, version_id)
    if definition is None or not definition.product_name.strip():
        raise HTTPException(status_code=409, detail="Save product basics before confirming this Version.")
    requirement_count = db.scalar(
        select(ProductRequirement.id)
        .where(ProductRequirement.version_id == version_id)
        .limit(1)
    )
    if requirement_count is None:
        raise HTTPException(status_code=409, detail="Add at least one product requirement before confirming this Version.")

    variant = _require_variant(db, version.variant_id)
    concept = _require_concept(db, variant.concept_id)
    now = _now()
    previous_confirmed = list(
        db.scalars(
            select(VariantVersion)
            .where(VariantVersion.variant_id == variant.id)
            .where(VariantVersion.status == "confirmed")
        ).all()
    )
    for previous in previous_confirmed:
        previous.status = "superseded"
        previous.updated_at = now

    version.status = "confirmed"
    version.confirmed_at = now
    version.updated_at = now

    decision = Decision(
        id=_id(),
        project_id=concept.project_id,
        stage="product_definition",
        decision_type=payload.decision_type,
        outcome=payload.outcome,
        rationale=payload.rationale,
        impact=payload.impact,
        conditions=payload.conditions,
        decided_at=now,
        created_at=now,
    )
    db.add(decision)
    db.flush()
    db.add(DecisionVersionLink(decision_id=decision.id, version_id=version_id))
    db.commit()
    db.refresh(version)
    db.refresh(decision)
    return jsonable_encoder({"version": version, "decision": decision})


def get_version_diff(db: Session, version_id: str) -> dict:
    version = _require_version(db, version_id)
    if not version.based_on_version_id:
        return jsonable_encoder({
            "version_id": version.id,
            "version_number": version.version_number,
            "base_version": None,
            "definition_changes": [],
            "requirement_changes": {"added": [], "removed": [], "changed": []},
            "bom_changes": {"added": [], "removed": [], "changed": []},
        })

    base_id = version.based_on_version_id
    base_definition = db.get(ProductDefinition, base_id)
    current_definition = db.get(ProductDefinition, version_id)
    definition_changes = []
    fields = [
        "product_name", "sku", "specification_summary", "category", "product_type",
        "priority", "planned_launch_date", "positioning", "market_entry",
        "target_price_min", "target_price_max", "target_price_currency",
        "target_contribution", "pricing_strategy", "certification_requirements",
        "warranty_policy", "summary",
    ]
    for field in fields:
        before = getattr(base_definition, field) if base_definition else None
        after = getattr(current_definition, field) if current_definition else None
        if before != after:
            definition_changes.append({"field": field, "before": before, "after": after})

    def compare_records(model, key_field: str, value_fields: list[str]):
        before_records = list(db.scalars(select(model).where(model.version_id == base_id)).all())
        after_records = list(db.scalars(select(model).where(model.version_id == version_id)).all())
        before_map = {getattr(record, key_field): record for record in before_records}
        after_map = {getattr(record, key_field): record for record in after_records}
        added = [key for key in after_map if key not in before_map]
        removed = [key for key in before_map if key not in after_map]
        changed = []
        for key in before_map.keys() & after_map.keys():
            differences = {
                field: {
                    "before": getattr(before_map[key], field),
                    "after": getattr(after_map[key], field),
                }
                for field in value_fields
                if getattr(before_map[key], field) != getattr(after_map[key], field)
            }
            if differences:
                changed.append({"key": key, "changes": differences})
        return {
            "added": [jsonable_encoder(after_map[key]) for key in added],
            "removed": [jsonable_encoder(before_map[key]) for key in removed],
            "changed": changed,
        }

    requirement_changes = compare_records(
        ProductRequirement,
        "code",
        ["title", "description", "target_value", "unit", "priority", "validation_method", "acceptance_criteria", "status"],
    )
    bom_changes = compare_records(
        BomItem,
        "item_code",
        ["name", "category", "specification", "material", "process", "quantity", "unit", "unit_cost_estimate", "estimate_currency", "is_optional"],
    )

    return jsonable_encoder({
        "version_id": version.id,
        "version_number": version.version_number,
        "base_version": {
            "id": base_id,
            "version_number": _require_version(db, base_id).version_number,
        },
        "definition_changes": definition_changes,
        "requirement_changes": requirement_changes,
        "bom_changes": bom_changes,
    })


def get_project_state(db: Session, project_id: str) -> dict:
    project = _require_project(db, project_id)
    concepts = list(db.scalars(
        select(ProductConcept)
        .where(ProductConcept.project_id == project_id)
        .where(ProductConcept.status != "archived")
        .order_by(ProductConcept.updated_at.desc())
    ).all())
    concept_details = []
    for concept in concepts:
        variants = list(db.scalars(
            select(ProductVariant)
            .where(ProductVariant.concept_id == concept.id)
            .where(ProductVariant.status != "archived")
            .order_by(ProductVariant.sort_order, ProductVariant.created_at)
        ).all())
        variant_details = []
        for variant in variants:
            versions = list(db.scalars(
                select(VariantVersion)
                .where(VariantVersion.variant_id == variant.id)
                .order_by(VariantVersion.version_number.desc())
            ).all())
            variant_details.append({"variant": variant, "versions": versions})
        concept_details.append({"concept": concept, "variants": variant_details})

    recent_decisions = list(db.scalars(
        select(Decision)
        .where(Decision.project_id == project_id)
        .order_by(Decision.decided_at.desc())
        .limit(10)
    ).all())

    return jsonable_encoder({
        "project": project,
        "concepts": concept_details,
        "recent_decisions": recent_decisions,
    })



def add_product_asset(db: Session, version_id: str, payload) -> dict:
    version = _require_draft(db, version_id)
    variant = _require_variant(db, version.variant_id)
    concept = _require_concept(db, variant.concept_id)
    file_asset = db.get(FileAsset, payload.file_id)
    if file_asset is None or file_asset.project_id != concept.project_id:
        raise HTTPException(
            status_code=404,
            detail="Source file was not found in this Project.",
        )

    asset = ProductAsset(
        id=_id(),
        version_id=version_id,
        file_id=payload.file_id,
        asset_role=payload.asset_role,
        caption=payload.caption,
        sort_order=payload.sort_order,
    )
    db.add(asset)
    version.updated_at = _now()
    db.commit()
    db.refresh(asset)
    return jsonable_encoder(asset)


def remove_product_asset(db: Session, version_id: str, asset_id: str) -> dict:
    _require_draft(db, version_id)
    asset = db.get(ProductAsset, asset_id)
    if asset is None or asset.version_id != version_id:
        raise HTTPException(status_code=404, detail="Product asset not found.")
    db.delete(asset)
    db.commit()
    return {"id": asset_id, "deleted": True}
