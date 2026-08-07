import math
import re

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.database import get_db
from app.deps import require_user_id
from app.models.note import Note
from app.models.timeline import Timeline
from app.schemas.note import CreateNoteBody, UpdateNoteBody
from app.serializers import note_dict

router = APIRouter(prefix="/api/notes", tags=["notes"])

HEX_COLOR_REGEX = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _parse_float(value) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(result):
        return None
    return result


@router.post("/", status_code=201)
async def create_note(
    body: CreateNoteBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.timelineId or not body.name or body.position is None:
        raise ApiError(400, "Timeline, nombre y posición son requeridos")

    pos = _parse_float(body.position)
    if pos is None or pos < 1:
        raise ApiError(400, "La posición debe ser al menos 1")

    result = await db.execute(
        select(Timeline).options(selectinload(Timeline.story)).where(Timeline.id == body.timelineId)
    )
    timeline = result.scalar_one_or_none()
    if not timeline:
        raise ApiError(404, "Línea temporal no encontrada")
    if timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para añadir notas a esta línea temporal")

    color = body.color if body.color and HEX_COLOR_REGEX.match(body.color) else None
    note = Note(
        name=body.name,
        description=str(body.description) if body.description not in (None, "") else None,
        position=pos,
        color=color,
        timelineId=body.timelineId,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return {"note": note_dict(note)}


async def _get_note_or_404(db: AsyncSession, note_id: str) -> Note:
    result = await db.execute(
        select(Note)
        .options(selectinload(Note.timeline).selectinload(Timeline.story))
        .where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise ApiError(404, "Nota no encontrada")
    return note


@router.put("/{note_id}")
async def update_note(
    note_id: str, body: UpdateNoteBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    note = await _get_note_or_404(db, note_id)
    if note.timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para editar esta nota")

    if body.name is not None:
        note.name = body.name
    if body.description is not None:
        note.description = None if body.description == "" else body.description
    if body.position is not None:
        pos = _parse_float(body.position)
        if pos is None or pos < 1:
            raise ApiError(400, "La posición debe ser al menos 1")
        note.position = pos
    if body.color is not None:
        note.color = None if body.color == "" or not HEX_COLOR_REGEX.match(body.color) else body.color

    await db.commit()
    await db.refresh(note)

    return {"note": note_dict(note)}


@router.delete("/{note_id}")
async def delete_note(note_id: str, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)):
    note = await _get_note_or_404(db, note_id)
    if note.timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para eliminar esta nota")

    await db.delete(note)
    await db.commit()

    return {"message": "Nota eliminada exitosamente"}
