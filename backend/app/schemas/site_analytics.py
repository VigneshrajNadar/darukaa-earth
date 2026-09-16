"""
SiteAnalytics Pydantic schemas.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SiteAnalyticsBase(BaseModel):
    """Base schema for site analytics properties."""

    recorded_date: date

    carbon_tonnes: float = Field(..., ge=0)
    biodiversity_score: float = Field(..., ge=0, le=100)
    vegetation_index: float = Field(..., ge=0, le=1)
    tree_cover_percentage: float = Field(..., ge=0, le=100)


class SiteAnalyticsCreate(SiteAnalyticsBase):
    """Schema for creating a new site analytics record."""

    site_id: uuid.UUID


class SiteAnalyticsRead(SiteAnalyticsBase):
    """Schema for reading a site analytics record."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    site_id: uuid.UUID
    created_at: datetime
