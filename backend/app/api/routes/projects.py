from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(
    include_archived: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[Project]:
    statement = select(Project).order_by(Project.updated_at.desc())
    if not include_archived:
        statement = statement.where(Project.status != "archived")
    return list(db.scalars(statement).all())


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
) -> Project:
    now = datetime.now(timezone.utc)
    project = Project(
        id=str(uuid4()),
        name=payload.name.strip(),
        category=payload.category,
        target_market=payload.target_market,
        description=payload.description,
        status="active",
        created_at=now,
        updated_at=now,
    )
    if not project.name:
        raise HTTPException(status_code=422, detail="Project name is required")

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db)) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == "archived":
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == "archived":
        raise HTTPException(status_code=404, detail="Project not found")

    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates:
        updates["name"] = (updates["name"] or "").strip()
        if not updates["name"]:
            raise HTTPException(status_code=422, detail="Project name is required")

    for key, value in updates.items():
        setattr(project, key, value)

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", response_model=ProjectRead)
def archive_project(project_id: str, db: Session = Depends(get_db)) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.status == "archived":
        raise HTTPException(status_code=404, detail="Project not found")

    now = datetime.now(timezone.utc)
    project.status = "archived"
    project.archived_at = now
    project.updated_at = now
    db.commit()
    db.refresh(project)
    return project