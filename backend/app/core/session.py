"""Cookie-based session management backed by the `sessions` table.

Behavioral parity with backend-old/src/index.ts:
- Cookie: httpOnly, 7 day max-age, secure+SameSite=None in prod (with cookie domain),
  SameSite=Lax in dev.
- Session destroyed server-side on logout (mirrors req.session.destroy()).
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Request, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.session import SessionModel

SESSION_COOKIE_NAME = "session_id"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 days


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware_utc(value: datetime) -> datetime:
    """Some DB drivers (e.g. SQLite, used in tests) drop tzinfo on round-trip;
    treat naive datetimes as UTC so comparisons never raise."""
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.is_production,
        samesite="none" if settings.is_production else "lax",
        domain=settings.cookie_domain,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        domain=settings.cookie_domain,
    )


async def create_session(db: AsyncSession, response: Response, user_id: str) -> str:
    session_id = secrets.token_urlsafe(32)
    expires_at = _utcnow() + timedelta(seconds=SESSION_MAX_AGE_SECONDS)
    db.add(SessionModel(id=session_id, userId=user_id, expiresAt=expires_at))
    await db.commit()
    set_session_cookie(response, session_id)
    return session_id


async def destroy_session(db: AsyncSession, response: Response, request: Request) -> None:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        await db.execute(delete(SessionModel).where(SessionModel.id == session_id))
        await db.commit()
    clear_session_cookie(response)


async def get_current_user_id(request: Request, db: AsyncSession) -> str | None:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        return None

    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session_row = result.scalar_one_or_none()
    if not session_row:
        return None

    if _as_aware_utc(session_row.expiresAt) < _utcnow():
        await db.execute(delete(SessionModel).where(SessionModel.id == session_id))
        await db.commit()
        return None

    return session_row.userId
