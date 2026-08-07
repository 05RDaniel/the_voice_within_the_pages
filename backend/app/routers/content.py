from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.database import get_db
from app.deps import require_user_id
from app.models.content import Content
from app.schemas.content import CreateContentBody
from app.serializers import content_dict

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/")
async def get_contents(user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Content).where(Content.userId == user_id).order_by(Content.createdAt.desc())
    )
    contents = result.scalars().all()
    return {"contents": [content_dict(c) for c in contents]}


@router.post("/", status_code=201)
async def create_content(
    body: CreateContentBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.title or not body.text:
        raise ApiError(400, "Título y texto son requeridos")

    content = Content(title=body.title, text=body.text, userId=user_id)
    db.add(content)
    await db.commit()
    await db.refresh(content)

    return {"content": content_dict(content)}
