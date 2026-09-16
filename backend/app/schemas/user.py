"""
User Pydantic schemas.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base schema for user properties."""

    name: str = Field(..., max_length=255)
    email: EmailStr = Field(..., max_length=255)
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(..., min_length=8, max_length=255)


class UserRead(UserBase):
    """Schema for reading a user (never exposes password hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
