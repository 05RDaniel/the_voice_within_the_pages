from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from cuid2 import cuid_wrapper
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.story import Visibility

if TYPE_CHECKING:
    from app.models.story import Story

_cuid = cuid_wrapper()


class Chapter(Base):
    __tablename__ = "Chapter"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    visibility: Mapped[Visibility] = mapped_column(
        Enum(Visibility, name="Visibility"), default=Visibility.PRIVATE, nullable=False
    )
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    storyId: Mapped[str] = mapped_column(String, ForeignKey("Story.id", ondelete="CASCADE"), nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    story: Mapped["Story"] = relationship(back_populates="chapters")
