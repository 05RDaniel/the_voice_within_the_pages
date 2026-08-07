from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.core.session import get_current_user_id
from app.database import get_db

DbSession = AsyncSession


async def optional_user_id(request: Request, db: AsyncSession = Depends(get_db)) -> str | None:
    return await get_current_user_id(request, db)


async def require_user_id(request: Request, db: AsyncSession = Depends(get_db)) -> str:
    user_id = await get_current_user_id(request, db)
    if not user_id:
        raise ApiError(401, "No autenticado")
    return user_id
