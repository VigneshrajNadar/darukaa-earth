"""
User Pydantic schemas — scaffold.

Full request/response schemas (UserCreate, UserRead, UserUpdate, TokenResponse)
will be defined in the authentication stage.
"""

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Shared user fields."""

    email: EmailStr
    full_name: str


class UserRead(UserBase):
    """User response schema (excludes sensitive fields like hashed_password)."""

    id: str

    model_config = {"from_attributes": True}
