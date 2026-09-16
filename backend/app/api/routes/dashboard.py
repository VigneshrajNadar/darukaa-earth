from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.project import Project
from app.models.site import Site
from app.models.site_analytics import SiteAnalytics
from app.models.user import User

router = APIRouter()


class DashboardSummary(BaseModel):
    total_projects: int
    total_sites: int
    total_area_hectares: float
    latest_carbon_tonnes: float | None


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get aggregated KPIs for the authenticated user.
    """
    # 1. Total projects
    total_projects = (
        db.query(func.count(Project.id))
        .filter(Project.owner_id == current_user.id)
        .scalar()
        or 0
    )

    # 2. Total sites & total area
    site_stats = (
        db.query(
            func.count(Site.id).label("total_sites"),
            func.sum(Site.area_hectares).label("total_area"),
        )
        .join(Project, Project.id == Site.project_id)
        .filter(Project.owner_id == current_user.id)
        .first()
    )

    total_sites = site_stats.total_sites if site_stats and site_stats.total_sites else 0
    total_area = (
        float(site_stats.total_area) if site_stats and site_stats.total_area else 0.0
    )

    # 3. Latest carbon (sum of max(recorded_date) per site)
    subq = (
        db.query(
            SiteAnalytics.site_id,
            func.max(SiteAnalytics.recorded_date).label("max_date"),
        )
        .join(Site, Site.id == SiteAnalytics.site_id)
        .join(Project, Project.id == Site.project_id)
        .filter(Project.owner_id == current_user.id)
        .group_by(SiteAnalytics.site_id)
        .subquery()
    )

    latest_carbon = (
        db.query(func.sum(SiteAnalytics.carbon_tonnes))
        .join(
            subq,
            (SiteAnalytics.site_id == subq.c.site_id)
            & (SiteAnalytics.recorded_date == subq.c.max_date),
        )
        .scalar()
    )

    return {
        "total_projects": total_projects,
        "total_sites": total_sites,
        "total_area_hectares": total_area,
        "latest_carbon_tonnes": float(latest_carbon)
        if latest_carbon is not None
        else None,
    }
