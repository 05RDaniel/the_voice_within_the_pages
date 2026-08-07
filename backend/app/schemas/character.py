from pydantic import BaseModel


class CreateCharacterBody(BaseModel):
    storyId: str | None = None
    name: str | None = None
    description: str | None = None


class UpdateCharacterBody(BaseModel):
    name: str | None = None
    description: str | None = None
