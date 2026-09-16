"""
Project service layer.
"""

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

    def list_projects_for_user(self, owner_id) -> Sequence[Project]:
        """List all projects for a user."""
        return self.repository.list_for_user(owner_id)
