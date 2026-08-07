"""Initial schema, mirroring backend-old/prisma/schema.prisma

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-07

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

visibility_enum = sa.Enum("PUBLIC", "PRIVATE", "UNLISTED", name="Visibility")


def upgrade() -> None:
    bind = op.get_bind()
    visibility_enum.create(bind, checkfirst=True)

    op.create_table(
        "User",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("username", sa.String(), nullable=False, unique=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("profileImage", sa.Text(), nullable=True),
        sa.Column("emailVerified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("emailVerificationToken", sa.String(), nullable=True, unique=True),
        sa.Column("emailVerificationTokenExpiresAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_User_emailVerificationToken", "User", ["emailVerificationToken"])

    op.create_table(
        "Content",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("userId", sa.String(), sa.ForeignKey("User.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Content_userId", "Content", ["userId"])
    op.create_index("ix_Content_userId_createdAt", "Content", ["userId", "createdAt"])

    op.create_table(
        "Quote",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column("author", sa.String(), nullable=True),
        sa.Column("lang", sa.String(), nullable=False, server_default="es"),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_Quote_lang", "Quote", ["lang"])

    op.create_table(
        "Story",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("visibility", visibility_enum, nullable=False, server_default="PRIVATE"),
        sa.Column("authorId", sa.String(), sa.ForeignKey("User.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Story_authorId", "Story", ["authorId"])
    op.create_index("ix_Story_authorId_createdAt", "Story", ["authorId", "createdAt"])
    op.create_index("ix_Story_visibility", "Story", ["visibility"])

    op.create_table(
        "Chapter",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("visibility", visibility_enum, nullable=False, server_default="PRIVATE"),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("storyId", sa.String(), sa.ForeignKey("Story.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Chapter_storyId", "Chapter", ["storyId"])
    op.create_index("ix_Chapter_storyId_order", "Chapter", ["storyId", "order"])

    op.create_table(
        "Character",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("storyId", sa.String(), sa.ForeignKey("Story.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Character_storyId", "Character", ["storyId"])

    op.create_table(
        "Timeline",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, server_default="Línea temporal principal"),
        sa.Column("storyId", sa.String(), sa.ForeignKey("Story.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Timeline_storyId", "Timeline", ["storyId"])

    op.create_table(
        "Note",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("position", sa.Float(), nullable=False),
        sa.Column("color", sa.String(), nullable=True),
        sa.Column("timelineId", sa.String(), sa.ForeignKey("Timeline.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Note_timelineId", "Note", ["timelineId"])

    op.create_table(
        "Plot",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start", sa.Float(), nullable=False),
        sa.Column("end", sa.Float(), nullable=False),
        sa.Column("color", sa.String(), nullable=True),
        sa.Column("timelineId", sa.String(), sa.ForeignKey("Timeline.id", ondelete="CASCADE"), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_Plot_timelineId", "Plot", ["timelineId"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("userId", sa.String(), sa.ForeignKey("User.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expiresAt", sa.DateTime(timezone=True), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_sessions_userId", "sessions", ["userId"])
    op.create_index("ix_sessions_expiresAt", "sessions", ["expiresAt"])


def downgrade() -> None:
    op.drop_table("sessions")
    op.drop_table("Plot")
    op.drop_table("Note")
    op.drop_table("Timeline")
    op.drop_table("Character")
    op.drop_table("Chapter")
    op.drop_table("Story")
    op.drop_table("Quote")
    op.drop_table("Content")
    op.drop_table("User")
    visibility_enum.drop(op.get_bind(), checkfirst=True)
