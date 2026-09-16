"""
Project Pydantic schemas.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProjectStatus, ProjectType


class ProjectBase(BaseModel):
    """Base schema for project properties."""

    name: str = Field(..., max_length=255)
    description: str | None = None
    project_type: ProjectType
    status: ProjectStatus


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""

    # The authenticated route injects ownership. It remains accepted for
    # backwards-compatible trusted clients, but may never target another user.
    owner_id: uuid.UUID | None = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: str | None = Field(None, max_length=255)
    description: str | None = None
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None


class ProjectRead(ProjectBase):
    """Schema for reading a project."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ProjectSummary(ProjectRead):
    """Schema exposing project summary information."""

    site_count: int = 0
    total_area_hectares: float = 0.0
    latest_carbon_tonnes: float | None = None
