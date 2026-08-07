"""Small dict-shaping helpers that mirror the exact Prisma `select`/`include`
shapes used in backend-old's controllers, so response bodies match byte-for-byte."""

from app.models.chapter import Chapter
from app.models.character import Character
from app.models.content import Content
from app.models.note import Note
from app.models.plot import Plot
from app.models.quote import Quote
from app.models.timeline import Timeline


def chapter_dict(c: Chapter) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "content": c.content,
        "visibility": c.visibility.value,
        "order": c.order,
        "createdAt": c.createdAt,
        "updatedAt": c.updatedAt,
    }


def character_dict(c: Character) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "storyId": c.storyId,
        "createdAt": c.createdAt,
        "updatedAt": c.updatedAt,
    }


def content_dict(c: Content) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "text": c.text,
        "userId": c.userId,
        "createdAt": c.createdAt,
        "updatedAt": c.updatedAt,
    }


def note_dict(n: Note) -> dict:
    return {
        "id": n.id,
        "name": n.name,
        "description": n.description,
        "position": n.position,
        "color": n.color,
        "timelineId": n.timelineId,
        "createdAt": n.createdAt,
        "updatedAt": n.updatedAt,
    }


def note_summary_dict(n: Note) -> dict:
    return {
        "id": n.id,
        "name": n.name,
        "description": n.description,
        "position": n.position,
        "color": n.color,
        "createdAt": n.createdAt,
    }


def plot_dict(p: Plot) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "start": p.start,
        "end": p.end,
        "color": p.color,
        "timelineId": p.timelineId,
        "createdAt": p.createdAt,
        "updatedAt": p.updatedAt,
    }


def plot_summary_dict(p: Plot) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "start": p.start,
        "end": p.end,
        "color": p.color,
        "createdAt": p.createdAt,
    }


def timeline_dict(t: Timeline, *, include_story: dict | None = None) -> dict:
    data = {
        "id": t.id,
        "name": t.name,
        "storyId": t.storyId,
        "createdAt": t.createdAt,
        "updatedAt": t.updatedAt,
    }
    if include_story is not None:
        data["story"] = include_story
    return data


def quote_dict(q: Quote) -> dict:
    return {
        "id": q.id,
        "quote": q.quote,
        "author": q.author,
        "lang": q.lang,
        "createdAt": q.createdAt,
    }
