from pydantic import BaseModel


class CreateTimelineBody(BaseModel):
    storyId: str | None = None
    name: str | None = None
