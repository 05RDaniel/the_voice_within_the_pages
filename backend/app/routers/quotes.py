import random

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.database import get_db
from app.models.quote import Quote

router = APIRouter(prefix="/api/quotes", tags=["quotes"])


@router.get("/random")
async def get_random_quote(lang: str = Query("es"), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quote).where(Quote.lang == lang))
    quotes = result.scalars().all()

    if not quotes:
        raise ApiError(404, "No quotes found for this language")

    quote = random.choice(quotes)
    return {"id": quote.id, "quote": quote.quote, "author": quote.author, "lang": quote.lang}


@router.get("/")
async def get_all_quotes(lang: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    query = select(Quote).order_by(Quote.createdAt.desc())
    if lang:
        query = query.where(Quote.lang == lang)

    result = await db.execute(query)
    quotes = result.scalars().all()

    return [
        {"id": q.id, "quote": q.quote, "author": q.author, "lang": q.lang, "createdAt": q.createdAt}
        for q in quotes
    ]
