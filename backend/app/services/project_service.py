"""
Project service layer.
"""

import uuid
from collections.abc import Sequence

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate


class ProjectService:
    """Service for managing projects."""

    def __init__(self, repository: ProjectRepository):
        self.repository = repository

    def create_project(self, project_in: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            name=project_in.name,
            description=project_in.description,
            project_type=project_in.project_type,
            status=project_in.status,
            owner_id=project_in.owner_id,
        )
        return self.repository.create(project)

    def get_project(self, project_id) -> Project | None:
        """Get a project by ID."""
        return self.repository.get_by_id(project_id)

    def list_for_user(
        self,
        owner_id: uuid.UUID,
        name: str | None = None,
        project_type: str | None = None,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[Sequence[Project], int]:
        """List all projects for a specific owner with pagination."""
        return self.repository.list_for_user(
            owner_id=owner_id,
            name=name,
            project_type=project_type,
            status=status,
            limit=limit,
            offset=offset,
        )

    def get_summary(self, project_id: uuid.UUID) -> dict | None:
        """Get project summary."""
        return self.repository.get_summary(project_id)
