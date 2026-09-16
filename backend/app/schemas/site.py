"""
Site Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SiteBase(BaseModel):
    """Base schema for site properties."""

    name: str = Field(..., max_length=255)


class SiteCreate(SiteBase):
    """Schema for creating a new site."""

    project_id: uuid.UUID
    # Accept standard GeoJSON dictionary representing a Polygon
    geometry: dict[str, Any]


class SiteUpdate(BaseModel):
    """Schema for updating a site."""

    name: str | None = Field(None, max_length=255)
    geometry: dict[str, Any] | None = None


class SiteRead(SiteBase):
    """
    Schema for reading a site.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    area_hectares: float | None = None
    created_at: datetime
    updated_at: datetime


class SiteSummary(SiteRead):
    """Schema for a site with latest metrics."""

    latest_carbon: float | None = None
    latest_biodiversity: float | None = None
    latest_vegetation: float | None = None
    latest_tree_cover: float | None = None


class Map(SiteRead):
    """
    Schema for site map representation.
    Converts PostGIS WKT string formats into proper GeoJSON dictionaries.
    """

    # For geometry and centroid, the SQLAlchemy ORM model returns WKT / WKB strings.
    # To output valid GeoJSON to the API client, we map them here.
    # We will use Shapely in the service/schema boundary to parse WKB/WKT,
    # or rely on ST_AsGeoJSON in the query.
    # For this implementation, we assume the repository uses ST_AsGeoJSON
    # or the service handles the dict mapping before dumping to schema.
    # So we accept dict here as well.
    geometry: dict[str, Any]
    centroid: dict[str, Any] | None

    created_at: datetime
    updated_at: datetime
