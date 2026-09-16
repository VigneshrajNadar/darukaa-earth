"""
Domain enums for Darukaa.Earth.

These Python enums are the single source of truth used by:
  - SQLAlchemy ORM models (mapped to PostgreSQL native ENUM types)
  - Pydantic schemas (for request/response validation)

Adding a new value requires:
  1. Updating the enum here
  2. Creating an Alembic migration to ALTER the PostgreSQL ENUM type
"""

from enum import StrEnum


class ProjectType(StrEnum):
    """Type of environmental project."""

    FOREST_RESTORATION = "forest_restoration"
    AFFORESTATION = "afforestation"
    MANGROVE_CONSERVATION = "mangrove_conservation"
    WETLAND_CONSERVATION = "wetland_conservation"
    BIODIVERSITY_CONSERVATION = "biodiversity_conservation"
    OTHER = "other"


class ProjectStatus(StrEnum):
    """Lifecycle status of a project."""

    PLANNING = "planning"
    ACTIVE = "active"
    MONITORING = "monitoring"
    COMPLETED = "completed"
    ARCHIVED = "archived"
