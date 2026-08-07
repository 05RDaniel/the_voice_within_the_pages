from typing import Any

from pydantic import BaseModel


class CreateNoteBody(BaseModel):
    timelineId: str | None = None
    name: str | None = None
    description: str | None = None
    position: Any = None
    color: str | None = None


class UpdateNoteBody(BaseModel):
    name: str | None = None
    description: str | None = None
    position: Any = None
    color: str | None = None
