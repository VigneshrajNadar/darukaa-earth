"""
User ORM model — scaffold.

Columns and relationships will be fully defined in the authentication stage.
Only the table name and primary key are defined here so Alembic can detect
and manage migrations from the start.
"""

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """Application user."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
