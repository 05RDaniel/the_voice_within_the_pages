"""Password hashing + email/username normalization.

Mirrors backend-old/src/utils/passwordUtils.ts exactly: bcrypt with 12 rounds,
no password strength rules beyond "non-empty".
"""

import re

import bcrypt

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

_BCRYPT_ROUNDS = 12


def validate_password_strength(password: str | None) -> tuple[bool, str | None]:
    if not password or len(password) == 0:
        return False, "La contraseña no puede estar vacía"
    return True, None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def normalize_email(email: str) -> str:
    return email.lower().strip()


def normalize_username(username: str) -> str:
    return username.strip()
