import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.site import SiteCreate, SiteRead, SiteSummary, SiteUpdate
from app.services.project_service import ProjectService
from app.services.site_service import SiteService

router = APIRouter()


def _check_project_access(project_id: uuid.UUID, db: Session, current_user: User):
    project_service = ProjectService(ProjectRepository(db))
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


@router.get("/map")
def get_sites_map(
    project_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all sites for a user as a GeoJSON FeatureCollection.
    Useful for Mapbox lightweight rendering.
    """
    if project_id:
        _check_project_access(project_id, db, current_user)

    service = SiteService(SiteRepository(db))
    features = service.get_map_features(owner_id=current_user.id, project_id=project_id)

    return {"type": "FeatureCollection", "features": features}


@router.get("", response_model=PaginatedResponse[SiteSummary])
def list_sites(
    project_id: uuid.UUID,
    name: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve sites for a project.
    """
    _check_project_access(project_id, db, current_user)

    service = SiteService(SiteRepository(db))
    offset = (page - 1) * page_size
    items, total = service.list_sites_for_project(
        project_id=project_id, name=name, limit=page_size, offset=offset
    )

    summaries = []
    for item in items:
        summary = service.get_summary(item.id)
        if summary:
            summaries.append(summary)

    return {"items": summaries, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=SiteRead, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new site.
    """
    _check_project_access(site_in.project_id, db, current_user)
    service = SiteService(SiteRepository(db))
    return service.create_site(site_in)


@router.get("/{site_id}", response_model=SiteSummary)
def read_site(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get site by ID.
    """
    service = SiteService(SiteRepository(db))
    site = service.get_site(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    _check_project_access(site.project_id, db, current_user)

    summary = service.get_summary(site_id)
    return summary


@router.patch("/{site_id}", response_model=SiteRead)
def update_site(
    site_id: uuid.UUID,
    site_in: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a site.
    """
    service = SiteService(SiteRepository(db))
    site = service.get_site(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    _check_project_access(site.project_id, db, current_user)

    return service.update_site(site_id, site_in)


@router.delete("/{site_id}")
def delete_site(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a site.
    """
    service = SiteService(SiteRepository(db))
    site = service.get_site(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    _check_project_access(site.project_id, db, current_user)

    service.delete_site(site_id)
    return {"ok": True}
