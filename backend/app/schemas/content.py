from pydantic import BaseModel


class CreateContentBody(BaseModel):
    title: str | None = None
    text: str | None = None
