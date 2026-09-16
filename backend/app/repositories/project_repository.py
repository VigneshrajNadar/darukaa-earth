"""
Project repository.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:
    """Repository for Project entity."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, project: Project) -> Project:
        """Create a new project."""
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project

    def get_by_id(self, project_id: uuid.UUID) -> Project | None:
        """Get a project by ID."""
        stmt = select(Project).where(Project.id == project_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def list_for_user(self, owner_id: uuid.UUID) -> Sequence[Project]:
        """List all projects for a specific owner."""
        stmt = select(Project).where(Project.owner_id == owner_id).order_by(Project.created_at.desc())
        return self.session.execute(stmt).scalars().all()

    def update(self, project: Project) -> Project:
        """Update an existing project."""
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        """Delete a project."""
        self.session.delete(project)
        self.session.commit()
