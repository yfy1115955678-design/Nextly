from io import BytesIO
from urllib.parse import quote

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import (
    BomItemWrite,
    ConceptCreate,
    ConceptRead,
    ConceptUpdate,
    ConfirmVersionInput,
    DevelopmentIssueWrite,
    ExperienceFlowWrite,
    PersonaWrite,
    ProductAssetWrite,
    ProductDefinitionWrite,
    ProductRiskWrite,
    QualityStandardWrite,
    RequirementWrite,
    VariantCreate,
    VariantRead,
    VersionCreate,
    VersionRead,
)
from app.services import product_service
from app.services.product_export_service import export_product_definition

router = APIRouter(tags=["product-definition"])


@router.get("/projects/{project_id}/concepts", response_model=list[ConceptRead])
def list_concepts(project_id: str, db: Session = Depends(get_db)):
    return product_service.list_concepts(db, project_id)


@router.post(
    "/projects/{project_id}/concepts",
    response_model=ConceptRead,
    status_code=status.HTTP_201_CREATED,
)
def create_concept(project_id: str, payload: ConceptCreate, db: Session = Depends(get_db)):
    return product_service.create_concept(db, project_id, payload)


@router.get("/concepts/{concept_id}", response_model=ConceptRead)
def get_concept(concept_id: str, db: Session = Depends(get_db)):
    return product_service.get_concept(db, concept_id)


@router.patch("/concepts/{concept_id}", response_model=ConceptRead)
def update_concept(concept_id: str, payload: ConceptUpdate, db: Session = Depends(get_db)):
    return product_service.update_concept(db, concept_id, payload)


@router.get("/concepts/{concept_id}/variants")
def list_variants(concept_id: str, db: Session = Depends(get_db)):
    return product_service.list_variants(db, concept_id)


@router.post(
    "/concepts/{concept_id}/variants",
    response_model=VariantRead,
    status_code=status.HTTP_201_CREATED,
)
def create_variant(concept_id: str, payload: VariantCreate, db: Session = Depends(get_db)):
    return product_service.create_variant(db, concept_id, payload)


@router.get("/variants/{variant_id}")
def get_variant(variant_id: str, db: Session = Depends(get_db)):
    return product_service.get_variant_detail(db, variant_id)


@router.post(
    "/variants/{variant_id}/versions",
    response_model=VersionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_version(variant_id: str, payload: VersionCreate, db: Session = Depends(get_db)):
    return product_service.create_version(db, variant_id, payload)


@router.get("/versions/{version_id}")
def get_version(version_id: str, db: Session = Depends(get_db)):
    return product_service.get_version_detail(db, version_id)


@router.put("/versions/{version_id}/definition")
def save_definition(version_id: str, payload: ProductDefinitionWrite, db: Session = Depends(get_db)):
    return product_service.save_definition(db, version_id, payload)


@router.put("/versions/{version_id}/personas")
def save_personas(version_id: str, payload: list[PersonaWrite], db: Session = Depends(get_db)):
    return product_service.replace_personas(db, version_id, payload)


@router.put("/versions/{version_id}/requirements")
def save_requirements(version_id: str, payload: list[RequirementWrite], db: Session = Depends(get_db)):
    return product_service.replace_requirements(db, version_id, payload)


@router.put("/versions/{version_id}/development-issues")
def save_development_issues(version_id: str, payload: list[DevelopmentIssueWrite], db: Session = Depends(get_db)):
    return product_service.replace_development_issues(db, version_id, payload)


@router.put("/versions/{version_id}/experience-flows")
def save_experience_flows(version_id: str, payload: list[ExperienceFlowWrite], db: Session = Depends(get_db)):
    return product_service.replace_experience_flows(db, version_id, payload)


@router.put("/versions/{version_id}/bom")
def save_bom(version_id: str, payload: list[BomItemWrite], db: Session = Depends(get_db)):
    return product_service.replace_bom(db, version_id, payload)


@router.put("/versions/{version_id}/quality-standards")
def save_quality_standards(version_id: str, payload: list[QualityStandardWrite], db: Session = Depends(get_db)):
    return product_service.replace_quality_standards(db, version_id, payload)


@router.put("/versions/{version_id}/risks")
def save_risks(version_id: str, payload: list[ProductRiskWrite], db: Session = Depends(get_db)):
    return product_service.replace_risks(db, version_id, payload)


@router.post("/versions/{version_id}/confirm")
def confirm_version(version_id: str, payload: ConfirmVersionInput, db: Session = Depends(get_db)):
    return product_service.confirm_version(db, version_id, payload)


@router.post("/versions/{version_id}/assets", status_code=status.HTTP_201_CREATED)
def add_product_asset(version_id: str, payload: ProductAssetWrite, db: Session = Depends(get_db)):
    return product_service.add_product_asset(db, version_id, payload)


@router.delete("/versions/{version_id}/assets/{asset_id}")
def remove_product_asset(version_id: str, asset_id: str, db: Session = Depends(get_db)):
    return product_service.remove_product_asset(db, version_id, asset_id)


@router.get("/versions/{version_id}/diff")
def get_version_diff(version_id: str, db: Session = Depends(get_db)):
    return product_service.get_version_diff(db, version_id)


@router.get("/versions/{version_id}/export")
def export_version(version_id: str, db: Session = Depends(get_db)):
    content, filename = export_product_definition(db, version_id)
    encoded_filename = quote(filename)
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"},
    )


@router.get("/projects/{project_id}/state")
def get_project_state(project_id: str, db: Session = Depends(get_db)):
    return product_service.get_project_state(db, project_id)
