from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from cuid2 import cuid_wrapper
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.content import Content
    from app.models.session import SessionModel
    from app.models.story import Story

_cuid = cuid_wrapper()


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    profileImage: Mapped[str | None] = mapped_column(Text, nullable=True)
    emailVerified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    emailVerificationToken: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    emailVerificationTokenExpiresAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    content: Mapped[list["Content"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    stories: Mapped[list["Story"]] = relationship(back_populates="author", cascade="all, delete-orphan")
    sessions: Mapped[list["SessionModel"]] = relationship(back_populates="user", cascade="all, delete-orphan")
