from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.database import get_db
from app.deps import optional_user_id, require_user_id
from app.models.chapter import Chapter
from app.models.character import Character
from app.models.story import Story, Visibility
from app.models.timeline import Timeline
from app.schemas.chapter import CreateChapterBody, UpdateChapterBody
from app.schemas.story import CreateStoryBody, UpdateStoryBody
from app.serializers import chapter_dict, character_dict

router = APIRouter(prefix="/api/stories", tags=["stories"])

VALID_CHAPTER_VISIBILITIES = {"PUBLIC", "PRIVATE"}


def _derived_visibility(chapters: list[Chapter]) -> str:
    return "PUBLIC" if any(c.visibility == Visibility.PUBLIC for c in chapters) else "PRIVATE"


async def _get_story_or_404(db: AsyncSession, story_id: str, *, with_relations: bool = False) -> Story:
    query = select(Story).where(Story.id == story_id)
    if with_relations:
        query = query.options(
            selectinload(Story.author),
            selectinload(Story.chapters),
            selectinload(Story.timelines).selectinload(Timeline.plots),
            selectinload(Story.timelines).selectinload(Timeline.notes),
            selectinload(Story.characters),
        )
    else:
        query = query.options(selectinload(Story.chapters))
    result = await db.execute(query)
    story = result.scalar_one_or_none()
    if not story:
        raise ApiError(404, "Historia no encontrada")
    return story


@router.get("/")
async def get_my_stories(user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Story)
        .options(selectinload(Story.chapters))
        .where(Story.authorId == user_id)
        .order_by(Story.createdAt.desc())
    )
    stories = result.scalars().all()

    return {
        "stories": [
            {
                "id": s.id,
                "title": s.title,
                "createdAt": s.createdAt,
                "updatedAt": s.updatedAt,
                "visibility": _derived_visibility(s.chapters),
            }
            for s in stories
        ]
    }


@router.post("/", status_code=201)
async def create_story(
    body: CreateStoryBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.title:
        raise ApiError(400, "El título es requerido")

    story = Story(title=body.title, visibility=Visibility.PRIVATE, authorId=user_id)
    story.timelines.append(Timeline())
    db.add(story)
    await db.commit()
    await db.refresh(story, attribute_names=["timelines"])

    return {
        "story": {
            "id": story.id,
            "title": story.title,
            "visibility": story.visibility.value,
            "createdAt": story.createdAt,
            "updatedAt": story.updatedAt,
            "timelines": [{"id": t.id} for t in story.timelines],
        }
    }


@router.get("/{story_id}")
async def get_story(story_id: str, user_id: str | None = Depends(optional_user_id), db: AsyncSession = Depends(get_db)):
    story = await _get_story_or_404(db, story_id, with_relations=True)

    visibility = _derived_visibility(story.chapters)
    if visibility == "PRIVATE" and story.authorId != user_id:
        raise ApiError(403, "No tienes acceso a esta historia")

    return {
        "story": {
            "id": story.id,
            "title": story.title,
            "authorId": story.authorId,
            "createdAt": story.createdAt,
            "updatedAt": story.updatedAt,
            "visibility": visibility,
            "author": {"id": story.author.id, "username": story.author.username},
            "chapters": [chapter_dict(c) for c in story.chapters],
            "timelines": [
                {
                    "id": t.id,
                    "name": t.name,
                    "_count": {"plots": len(t.plots), "notes": len(t.notes)},
                }
                for t in story.timelines
            ],
            "characters": [character_dict(c) for c in story.characters],
        }
    }


@router.put("/{story_id}")
async def update_story(
    story_id: str,
    body: UpdateStoryBody,
    user_id: str = Depends(require_user_id),
    db: AsyncSession = Depends(get_db),
):
    story = await _get_story_or_404(db, story_id)

    if story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para editar esta historia")

    if body.title:
        story.title = body.title
    await db.commit()
    await db.refresh(story, attribute_names=["chapters"])

    return {
        "story": {
            "id": story.id,
            "title": story.title,
            "createdAt": story.createdAt,
            "updatedAt": story.updatedAt,
            "visibility": _derived_visibility(story.chapters),
        }
    }


@router.delete("/{story_id}")
async def delete_story(story_id: str, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)):
    story = await _get_story_or_404(db, story_id)

    if story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para eliminar esta historia")

    await db.delete(story)
    await db.commit()

    return {"message": "Historia eliminada exitosamente"}


# --- Chapters (nested under a story) -----------------------------------------------------


async def _get_story_for_chapters(db: AsyncSession, story_id: str) -> Story:
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise ApiError(404, "Historia no encontrada")
    return story


@router.get("/{story_id}/chapters")
async def get_chapters(
    story_id: str, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    story = await _get_story_for_chapters(db, story_id)
    if story.visibility == Visibility.PRIVATE and story.authorId != user_id:
        raise ApiError(403, "No tienes acceso a esta historia")

    result = await db.execute(select(Chapter).where(Chapter.storyId == story_id).order_by(Chapter.order.asc()))
    chapters = result.scalars().all()

    return {"chapters": [chapter_dict(c) for c in chapters]}


@router.post("/{story_id}/chapters", status_code=201)
async def create_chapter(
    story_id: str,
    body: CreateChapterBody,
    user_id: str = Depends(require_user_id),
    db: AsyncSession = Depends(get_db),
):
    story = await _get_story_for_chapters(db, story_id)
    if story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para añadir capítulos")

    if not body.name or body.content is None:
        raise ApiError(400, "Nombre y contenido son requeridos")

    count_result = await db.execute(select(Chapter).where(Chapter.storyId == story_id))
    count = len(count_result.scalars().all())

    visibility_value = body.visibility if body.visibility in VALID_CHAPTER_VISIBILITIES else "PRIVATE"

    chapter = Chapter(
        storyId=story_id,
        name=str(body.name).strip(),
        content=str(body.content),
        visibility=Visibility(visibility_value),
        order=count,
    )
    db.add(chapter)
    await db.commit()
    await db.refresh(chapter)

    return {"chapter": chapter_dict(chapter)}


async def _get_chapter_or_404(db: AsyncSession, story_id: str, chapter_id: str) -> Chapter:
    result = await db.execute(
        select(Chapter)
        .options(selectinload(Chapter.story))
        .where(Chapter.id == chapter_id, Chapter.storyId == story_id)
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        raise ApiError(404, "Capítulo no encontrado")
    return chapter


@router.get("/{story_id}/chapters/{chapter_id}")
async def get_chapter(
    story_id: str,
    chapter_id: str,
    user_id: str = Depends(require_user_id),
    db: AsyncSession = Depends(get_db),
):
    chapter = await _get_chapter_or_404(db, story_id, chapter_id)
    if chapter.story.visibility == Visibility.PRIVATE and chapter.story.authorId != user_id:
        raise ApiError(403, "No tienes acceso")

    return {"chapter": chapter_dict(chapter)}


@router.put("/{story_id}/chapters/{chapter_id}")
async def update_chapter(
    story_id: str,
    chapter_id: str,
    body: UpdateChapterBody,
    user_id: str = Depends(require_user_id),
    db: AsyncSession = Depends(get_db),
):
    chapter = await _get_chapter_or_404(db, story_id, chapter_id)
    if chapter.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para editar este capítulo")

    if body.name is not None:
        chapter.name = str(body.name).strip()
    if body.content is not None:
        chapter.content = str(body.content)
    if body.visibility is not None and body.visibility in VALID_CHAPTER_VISIBILITIES:
        chapter.visibility = Visibility(body.visibility)
    if isinstance(body.order, (int, float)) and not isinstance(body.order, bool):
        chapter.order = int(body.order)

    await db.commit()
    await db.refresh(chapter)

    return {"chapter": chapter_dict(chapter)}


@router.delete("/{story_id}/chapters/{chapter_id}")
async def delete_chapter(
    story_id: str,
    chapter_id: str,
    user_id: str = Depends(require_user_id),
    db: AsyncSession = Depends(get_db),
):
    chapter = await _get_chapter_or_404(db, story_id, chapter_id)
    if chapter.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para eliminar este capítulo")

    await db.delete(chapter)
    await db.commit()

    return {"message": "Capítulo eliminado"}
