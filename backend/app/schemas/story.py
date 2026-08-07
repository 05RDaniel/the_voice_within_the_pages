from pydantic import BaseModel


class CreateStoryBody(BaseModel):
    title: str | None = None


class UpdateStoryBody(BaseModel):
    title: str | None = None
