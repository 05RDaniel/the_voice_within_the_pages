from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from cuid2 import cuid_wrapper
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.plot import Plot
    from app.models.story import Story

_cuid = cuid_wrapper()


class Timeline(Base):
    __tablename__ = "Timeline"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    name: Mapped[str] = mapped_column(String, default="Línea temporal principal", nullable=False)
    storyId: Mapped[str] = mapped_column(String, ForeignKey("Story.id", ondelete="CASCADE"), nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    story: Mapped["Story"] = relationship(back_populates="timelines")
    plots: Mapped[list["Plot"]] = relationship(back_populates="timeline", cascade="all, delete-orphan")
    notes: Mapped[list["Note"]] = relationship(back_populates="timeline", cascade="all, delete-orphan")
