from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from cuid2 import cuid_wrapper
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.story import Story

_cuid = cuid_wrapper()


class Character(Base):
    __tablename__ = "Character"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    storyId: Mapped[str] = mapped_column(String, ForeignKey("Story.id", ondelete="CASCADE"), nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    story: Mapped["Story"] = relationship(back_populates="characters")
