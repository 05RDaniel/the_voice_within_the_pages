from typing import Any

from pydantic import BaseModel


class CreateChapterBody(BaseModel):
    name: str | None = None
    content: Any = None
    visibility: str | None = None


class UpdateChapterBody(BaseModel):
    name: str | None = None
    content: Any = None
    visibility: str | None = None
    order: Any = None
