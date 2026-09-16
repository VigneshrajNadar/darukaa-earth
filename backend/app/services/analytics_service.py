"""
Site Analytics service layer.
"""

import uuid
from collections.abc import Sequence
from datetime import date

from app.models.site_analytics import SiteAnalytics
from app.repositories.site_analytics_repository import SiteAnalyticsRepository
from app.schemas.site_analytics import SiteAnalyticsCreate


class AnalyticsService:
    """Service for managing site analytics."""

    def __init__(self, repository: SiteAnalyticsRepository):
        self.repository = repository

    def create_analytics(self, analytics_in: SiteAnalyticsCreate) -> SiteAnalytics:
        """Create a new analytics record."""
        analytics = SiteAnalytics(
            site_id=analytics_in.site_id,
            recorded_date=analytics_in.recorded_date,
            carbon_tonnes=analytics_in.carbon_tonnes,
            biodiversity_score=analytics_in.biodiversity_score,
            vegetation_index=analytics_in.vegetation_index,
            tree_cover_percentage=analytics_in.tree_cover_percentage,
        )
        return self.repository.create(analytics)

    def list_analytics_for_site(
        self,
        site_id: uuid.UUID,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[Sequence[SiteAnalytics], int]:
        """List all analytics for a site."""
        return self.repository.list_by_site(
            site_id=site_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )
