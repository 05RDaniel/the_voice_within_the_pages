from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.database import get_db
from app.deps import optional_user_id, require_user_id
from app.models.story import Story
from app.models.timeline import Timeline
from app.schemas.timeline import CreateTimelineBody
from app.serializers import note_summary_dict, plot_summary_dict, timeline_dict

router = APIRouter(prefix="/api/timelines", tags=["timelines"])


def _timeline_with_relations_query():
    return select(Timeline).options(
        selectinload(Timeline.story),
        selectinload(Timeline.plots),
        selectinload(Timeline.notes),
    )


@router.get("/")
async def get_my_timelines(user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        _timeline_with_relations_query()
        .join(Story, Timeline.storyId == Story.id)
        .where(Story.authorId == user_id)
        .order_by(Timeline.createdAt.desc())
    )
    timelines = result.scalars().unique().all()

    return {
        "timelines": [
            {
                **timeline_dict(t, include_story={"id": t.story.id, "title": t.story.title}),
                "plots": [plot_summary_dict(p) for p in sorted(t.plots, key=lambda p: p.createdAt)],
                "notes": [note_summary_dict(n) for n in sorted(t.notes, key=lambda n: n.createdAt)],
            }
            for t in timelines
        ]
    }


@router.get("/{timeline_id}")
async def get_timeline(
    timeline_id: str, user_id: str | None = Depends(optional_user_id), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(_timeline_with_relations_query().where(Timeline.id == timeline_id))
    timeline = result.scalar_one_or_none()

    if not timeline:
        raise ApiError(404, "Línea temporal no encontrada")

    if timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes acceso a esta línea temporal")

    return {
        "timeline": {
            **timeline_dict(
                timeline,
                include_story={
                    "id": timeline.story.id,
                    "title": timeline.story.title,
                    "authorId": timeline.story.authorId,
                },
            ),
            "plots": [plot_summary_dict(p) for p in sorted(timeline.plots, key=lambda p: p.createdAt)],
            "notes": [note_summary_dict(n) for n in sorted(timeline.notes, key=lambda n: n.createdAt)],
        }
    }


@router.post("/", status_code=201)
async def create_timeline(
    body: CreateTimelineBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.storyId:
        raise ApiError(400, "El ID de la historia es requerido")

    result = await db.execute(select(Story).where(Story.id == body.storyId))
    story = result.scalar_one_or_none()
    if not story:
        raise ApiError(404, "Historia no encontrada")
    if story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para añadir líneas temporales a esta historia")

    timeline = Timeline(storyId=body.storyId)
    if body.name:
        timeline.name = body.name
    db.add(timeline)
    await db.commit()
    await db.refresh(timeline)

    return {
        "timeline": timeline_dict(timeline, include_story={"id": story.id, "title": story.title}),
    }


@router.delete("/{timeline_id}")
async def delete_timeline(
    timeline_id: str, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Timeline).options(selectinload(Timeline.story)).where(Timeline.id == timeline_id)
    )
    timeline = result.scalar_one_or_none()
    if not timeline:
        raise ApiError(404, "Línea temporal no encontrada")
    if timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para eliminar esta línea temporal")

    await db.delete(timeline)
    await db.commit()

    return {"message": "Línea temporal eliminada exitosamente"}
