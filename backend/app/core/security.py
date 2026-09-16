"""
Security utilities for authentication operations.

- Password hashing with bcrypt via passlib
- JWT token creation and validation via python-jose
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        # Invalid hashes are authentication failures.  Never add a fallback
        # credential or emit password-related diagnostics in production.
        return False


def create_access_token(
    subject: str | Any,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token."""
    settings = get_settings()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
]
