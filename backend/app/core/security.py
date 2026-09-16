"""
Security utilities — ARCHITECTURAL SCAFFOLD ONLY.

These functions define the interface for authentication operations.
They are NOT implemented in this stage. Calling them will raise NotImplementedError.

Implementation will happen in the dedicated authentication stage:
- Password hashing with bcrypt via passlib
- JWT token creation and validation via python-jose
- Token refresh logic
- Password reset flow
"""

from datetime import datetime, timedelta, timezone
from typing import Any


def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    NOT IMPLEMENTED — scaffold only.
    Will use passlib[bcrypt] in the authentication stage.
    """
    raise NotImplementedError(
        "hash_password is not implemented. "
        "This will be implemented in the authentication stage."
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.

    NOT IMPLEMENTED — scaffold only.
    """
    raise NotImplementedError(
        "verify_password is not implemented. "
        "This will be implemented in the authentication stage."
    )


def create_access_token(
    subject: str | Any,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token.

    NOT IMPLEMENTED — scaffold only.
    Will use python-jose[cryptography] in the authentication stage.
    """
    raise NotImplementedError(
        "create_access_token is not implemented. "
        "This will be implemented in the authentication stage."
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    NOT IMPLEMENTED — scaffold only.
    """
    raise NotImplementedError(
        "decode_access_token is not implemented. "
        "This will be implemented in the authentication stage."
    )


# Silence unused imports until implementation stage
__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "datetime",
    "timedelta",
    "timezone",
]
