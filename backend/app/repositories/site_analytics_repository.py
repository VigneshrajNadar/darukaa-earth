"""
SiteAnalytics repository.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site_analytics import SiteAnalytics


class SiteAnalyticsRepository:
    """Repository for SiteAnalytics entity."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, analytics: SiteAnalytics) -> SiteAnalytics:
        """Create a new site analytics record."""
        self.session.add(analytics)
        self.session.commit()
        self.session.refresh(analytics)
        return analytics

    def list_by_site(self, site_id: uuid.UUID) -> Sequence[SiteAnalytics]:
        """List all analytics records for a specific site."""
        stmt = select(SiteAnalytics).where(SiteAnalytics.site_id == site_id).order_by(SiteAnalytics.recorded_date.desc())
        return self.session.execute(stmt).scalars().all()

    def delete(self, analytics: SiteAnalytics) -> None:
        """Delete an analytics record."""
        self.session.delete(analytics)
        self.session.commit()
