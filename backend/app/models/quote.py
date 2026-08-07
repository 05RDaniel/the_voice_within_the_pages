from __future__ import annotations

from datetime import datetime

from cuid2 import cuid_wrapper
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

_cuid = cuid_wrapper()


class Quote(Base):
    __tablename__ = "Quote"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    lang: Mapped[str] = mapped_column(String, default="es", nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
