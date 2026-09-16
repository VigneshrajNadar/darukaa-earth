"""
User repository.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Repository for User entity."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, user: User) -> User:
        """Create a new user."""
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Get a user by ID."""
        stmt = select(User).where(User.id == user_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_email(self, email: str) -> User | None:
        """Get a user by email (case-insensitive)."""
        stmt = select(User).where(User.email.ilike(email))
        return self.session.execute(stmt).scalar_one_or_none()
