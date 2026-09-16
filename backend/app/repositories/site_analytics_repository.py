"""
SiteAnalytics repository.
"""

import uuid
from collections.abc import Sequence
from datetime import date

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

    def list_by_site(
        self,
        site_id: uuid.UUID,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[Sequence[SiteAnalytics], int]:
        """List all analytics for a site with date filtering and pagination."""
        stmt = select(SiteAnalytics).where(SiteAnalytics.site_id == site_id)

        if start_date:
            stmt = stmt.where(SiteAnalytics.recorded_date >= start_date)
        if end_date:
            stmt = stmt.where(SiteAnalytics.recorded_date <= end_date)

        # Get total count
        from sqlalchemy import func

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.execute(count_stmt).scalar_one()

        stmt = (
            stmt.order_by(SiteAnalytics.recorded_date.desc())
            .limit(limit)
            .offset(offset)
        )
        items = self.session.execute(stmt).scalars().all()
        return items, total

    def delete(self, analytics: SiteAnalytics) -> None:
        """Delete an analytics record."""
        self.session.delete(analytics)
        self.session.commit()
