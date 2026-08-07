from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from cuid2 import cuid_wrapper
from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.chapter import Chapter
    from app.models.character import Character
    from app.models.timeline import Timeline
    from app.models.user import User

_cuid = cuid_wrapper()


class Visibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    UNLISTED = "UNLISTED"


class Story(Base):
    __tablename__ = "Story"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    title: Mapped[str] = mapped_column(String, nullable=False)
    visibility: Mapped[Visibility] = mapped_column(
        Enum(Visibility, name="Visibility"), default=Visibility.PRIVATE, nullable=False
    )
    authorId: Mapped[str] = mapped_column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    author: Mapped["User"] = relationship(back_populates="stories")
    chapters: Mapped[list["Chapter"]] = relationship(
        back_populates="story", cascade="all, delete-orphan", order_by="Chapter.order"
    )
    timelines: Mapped[list["Timeline"]] = relationship(back_populates="story", cascade="all, delete-orphan")
    characters: Mapped[list["Character"]] = relationship(back_populates="story", cascade="all, delete-orphan")
