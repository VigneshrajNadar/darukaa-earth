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

    def list_by_project(self, project_id: uuid.UUID) -> Sequence[Site]:
        """List all sites for a specific project."""
        stmt = select(Site).where(Site.project_id == project_id).order_by(Site.created_at.desc())
        return self.session.execute(stmt).scalars().all()

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
