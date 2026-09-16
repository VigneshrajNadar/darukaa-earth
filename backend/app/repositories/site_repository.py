"""
Site repository.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site import Site


class SiteRepository:
    """Repository for Site entity."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, site: Site) -> Site:
        """Create a new site."""
        self.session.add(site)
        self.session.commit()
        self.session.refresh(site)
        return site

    def get_by_id(self, site_id: uuid.UUID) -> Site | None:
        """Get a site by ID."""
        stmt = select(Site).where(Site.id == site_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def list_by_project(
        self,
        project_id: uuid.UUID,
        name: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[Sequence[Site], int]:
        """List all sites for a specific project with pagination."""
        stmt = select(Site).where(Site.project_id == project_id)
        if name:
            stmt = stmt.where(Site.name.ilike(f"%{name}%"))

        # Get total count
        from sqlalchemy import func

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.execute(count_stmt).scalar_one()

        stmt = stmt.order_by(Site.created_at.desc()).limit(limit).offset(offset)
        items = self.session.execute(stmt).scalars().all()
        return items, total

    def get_map_features(
        self, owner_id: uuid.UUID, project_id: uuid.UUID | None = None
    ) -> list[dict]:
        """Get all sites for an owner as GeoJSON features."""
        from sqlalchemy import func

        from app.models.project import Project

        # We use ST_AsGeoJSON to get the geometry directly in GeoJSON format
        stmt = (
            select(
                Site.id,
                Site.name,
                Site.project_id,
                Project.name.label("project_name"),
                Site.area_hectares,
                func.ST_AsGeoJSON(Site.geometry).label("geometry_json"),
            )
            .join(Project, Project.id == Site.project_id)
            .where(Project.owner_id == owner_id)
        )

        if project_id:
            stmt = stmt.where(Site.project_id == project_id)

        results = self.session.execute(stmt).all()

        import json

        features = []
        for row in results:
            if not row.geometry_json:
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": json.loads(row.geometry_json),
                    "properties": {
                        "id": str(row.id),
                        "name": row.name,
                        "project_id": str(row.project_id),
                        "project_name": row.project_name,
                        "area_hectares": float(row.area_hectares)
                        if row.area_hectares
                        else 0.0,
                    },
                }
            )
        return features

    def get_summary(self, site_id: uuid.UUID) -> dict | None:
        """Get the latest metrics for a site."""
        from app.models.site_analytics import SiteAnalytics

        site = self.get_by_id(site_id)
        if not site:
            return None

        stmt = (
            select(SiteAnalytics)
            .where(SiteAnalytics.site_id == site_id)
            .order_by(SiteAnalytics.recorded_date.desc())
            .limit(1)
        )
        latest = self.session.execute(stmt).scalar_one_or_none()

        return {
            "id": site.id,
            "name": site.name,
            "project_id": site.project_id,
            "area_hectares": site.area_hectares,
            "created_at": site.created_at,
            "updated_at": site.updated_at,
            "latest_carbon": latest.carbon_tonnes if latest else None,
            "latest_biodiversity": latest.biodiversity_score if latest else None,
            "latest_vegetation": latest.vegetation_index if latest else None,
            "latest_tree_cover": latest.tree_cover_percentage if latest else None,
        }

    def update(self, site: Site) -> Site:
        """Update an existing site."""
        self.session.add(site)
        self.session.commit()
        self.session.refresh(site)
        return site

    def delete(self, site: Site) -> None:
        """Delete a site."""
        self.session.delete(site)
        self.session.commit()
