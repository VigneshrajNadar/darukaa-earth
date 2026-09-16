import uuid
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_analytics_repository import SiteAnalyticsRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.site_analytics import SiteAnalyticsRead
from app.services.analytics_service import AnalyticsService
from app.services.project_service import ProjectService
from app.services.site_service import SiteService

router = APIRouter()


def _check_site_access(site_id: uuid.UUID, db: Session, current_user: User):
    site_service = SiteService(SiteRepository(db))
    site = site_service.get_site(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    project_service = ProjectService(ProjectRepository(db))
    project = project_service.get_project(site.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


@router.get("/{site_id}/analytics", response_model=PaginatedResponse[SiteAnalyticsRead])
def list_analytics(
    site_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve chronologically ordered analytics for a site.
    """
    _check_site_access(site_id, db, current_user)

    service = AnalyticsService(SiteAnalyticsRepository(db))
    offset = (page - 1) * page_size
    items, total = service.list_analytics_for_site(
        site_id=site_id,
        start_date=start_date,
        end_date=end_date,
        limit=page_size,
        offset=offset,
    )

    return {"items": items, "total": total, "page": page, "page_size": page_size}
