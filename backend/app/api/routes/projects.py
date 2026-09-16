import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectSummary,
    ProjectUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProjectSummary])
def list_projects(
    name: str | None = None,
    project_type: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve projects for the current user.
    """
    service = ProjectService(ProjectRepository(db))
    offset = (page - 1) * page_size
    items, total = service.list_for_user(
        owner_id=current_user.id,
        name=name,
        project_type=project_type,
        status=status,
        limit=page_size,
        offset=offset,
    )

    # We map items to ProjectSummary using the repository method
    summaries = []
    for item in items:
        summary = service.get_summary(item.id)
        if summary:
            summaries.append(summary)

    return {"items": summaries, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new project.
    """
    # Enforce owner constraint
    if project_in.owner_id is not None and project_in.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to create project for other user"
        )
    service = ProjectService(ProjectRepository(db))
    return service.create_project(
        project_in.model_copy(update={"owner_id": current_user.id})
    )


@router.get("/{project_id}", response_model=ProjectSummary)
def read_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get project by ID.
    """
    service = ProjectService(ProjectRepository(db))
    project = service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    summary = service.get_summary(project_id)
    return summary


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a project.
    """
    service = ProjectService(ProjectRepository(db))
    project = service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return service.update_project(project_id, project_in)


@router.delete("/{project_id}")
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a project.
    """
    service = ProjectService(ProjectRepository(db))
    project = service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    service.delete_project(project_id)
    return {"ok": True}
