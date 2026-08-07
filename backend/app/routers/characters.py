from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.database import get_db
from app.deps import require_user_id
from app.models.character import Character
from app.models.story import Story
from app.schemas.character import CreateCharacterBody, UpdateCharacterBody
from app.serializers import character_dict

router = APIRouter(prefix="/api/characters", tags=["characters"])


@router.post("/", status_code=201)
async def create_character(
    body: CreateCharacterBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.storyId or not body.name or not isinstance(body.name, str) or not body.name.strip():
        raise ApiError(400, "Historia y nombre son requeridos")

    result = await db.execute(select(Story).where(Story.id == body.storyId))
    story = result.scalar_one_or_none()
    if not story:
        raise ApiError(404, "Historia no encontrada")
    if story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para añadir personajes a esta historia")

    description = body.description
    character = Character(
        storyId=body.storyId,
        name=body.name.strip(),
        description=str(description).strip() if description is not None and description != "" else None,
    )
    db.add(character)
    await db.commit()
    await db.refresh(character)

    return {"character": character_dict(character)}


async def _get_character_or_404(db: AsyncSession, character_id: str) -> Character:
    result = await db.execute(
        select(Character).options(selectinload(Character.story)).where(Character.id == character_id)
    )
    character = result.scalar_one_or_none()
    if not character:
        raise ApiError(404, "Personaje no encontrado")
    return character


@router.put("/{character_id}")
async def update_character(
    character_id: str,
    body: UpdateCharacterBody,
    user_id: str = Depends(require_user_id),
    db: AsyncSession = Depends(get_db),
):
    character = await _get_character_or_404(db, character_id)
    if character.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para editar este personaje")

    if body.name is not None:
        character.name = str(body.name).strip()
    if body.description is not None:
        character.description = None if body.description == "" else (str(body.description).strip() or None)

    await db.commit()
    await db.refresh(character)

    return {"character": character_dict(character)}


@router.delete("/{character_id}")
async def delete_character(
    character_id: str, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    character = await _get_character_or_404(db, character_id)
    if character.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para eliminar este personaje")

    await db.delete(character)
    await db.commit()

    return {"message": "Personaje eliminado"}
