from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse[T](BaseModel):
    """Generic schema for paginated responses."""

    items: list[T]
    total: int
    page: int
    page_size: int
