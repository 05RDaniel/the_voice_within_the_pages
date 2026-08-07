from typing import Any

from pydantic import BaseModel


class CreatePlotBody(BaseModel):
    timelineId: str | None = None
    name: str | None = None
    description: str | None = None
    start: Any = None
    end: Any = None
    color: str | None = None


class UpdatePlotBody(BaseModel):
    name: str | None = None
    description: str | None = None
    start: Any = None
    end: Any = None
    color: str | None = None
