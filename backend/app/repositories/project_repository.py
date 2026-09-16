"""
Project repository.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:
    """Repository for Project entity."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, project: Project) -> Project:
        """Create a new project."""
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project

    def get_by_id(self, project_id: uuid.UUID) -> Project | None:
        """Get a project by ID."""
        stmt = select(Project).where(Project.id == project_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def list_for_user(
        self,
        owner_id: uuid.UUID,
        name: str | None = None,
        project_type: str | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[Sequence[Project], int]:
        """List all projects for a specific owner with pagination and filtering."""
        stmt = select(Project).where(Project.owner_id == owner_id)

        if name:
            stmt = stmt.where(Project.name.ilike(f"%{name}%"))
        if project_type:
            stmt = stmt.where(Project.project_type == project_type)
        if status:
            stmt = stmt.where(Project.status == status)

        # Get total count
        from sqlalchemy import func

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.execute(count_stmt).scalar_one()

        # Get items
        stmt = stmt.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        items = self.session.execute(stmt).scalars().all()
        return items, total

    def get_summary(self, project_id: uuid.UUID) -> dict | None:
        """Get an aggregate summary for a project."""
        from sqlalchemy import func

        from app.models.site import Site
        from app.models.site_analytics import SiteAnalytics

        project = self.get_by_id(project_id)
        if not project:
            return None

        # Get site count and total area
        site_stats_stmt = select(
            func.count(Site.id).label("site_count"),
            func.sum(Site.area_hectares).label("total_area"),
        ).where(Site.project_id == project_id)

        site_stats = self.session.execute(site_stats_stmt).first()
        site_count = (
            site_stats.site_count if site_stats and site_stats.site_count else 0
        )
        total_area = (
            float(site_stats.total_area)
            if site_stats and site_stats.total_area
            else 0.0
        )

        # Get latest carbon for the project (sum of latest carbon for all its sites)
        # 1. Latest analytics per site
        subq = (
            select(
                SiteAnalytics.site_id,
                func.max(SiteAnalytics.recorded_date).label("max_date"),
            )
            .join(Site, Site.id == SiteAnalytics.site_id)
            .where(Site.project_id == project_id)
            .group_by(SiteAnalytics.site_id)
            .subquery()
        )

        # 2. Join back to get carbon value and sum it
        latest_carbon_stmt = select(func.sum(SiteAnalytics.carbon_tonnes)).join(
            subq,
            (SiteAnalytics.site_id == subq.c.site_id)
            & (SiteAnalytics.recorded_date == subq.c.max_date),
        )

        latest_carbon = self.session.execute(latest_carbon_stmt).scalar_one_or_none()
        if latest_carbon is not None:
            latest_carbon = float(latest_carbon)

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "project_type": project.project_type,
            "status": project.status,
            "owner_id": project.owner_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "site_count": site_count,
            "total_area_hectares": total_area,
            "latest_carbon_tonnes": latest_carbon,
        }

    def update(self, project: Project) -> Project:
        """Update an existing project."""
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        """Delete a project."""
        self.session.delete(project)
        self.session.commit()
