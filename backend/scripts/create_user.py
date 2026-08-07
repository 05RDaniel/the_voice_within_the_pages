"""Bootstrap user creation, mirroring backend-old/scripts/createUser.ts.

Usage: python -m scripts.create_user (run from the backend/ directory, with the venv active).
"""

import asyncio

from sqlalchemy import select

from app.core.security import hash_password, normalize_email, normalize_username
from app.database import AsyncSessionLocal
from app.models.user import User


async def create_user() -> None:
    username = "dronkus"
    email = "dronkus@ej.com"
    password = "admin123"

    normalized_email = normalize_email(email)
    normalized_username = normalize_username(username)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where((User.email == normalized_email) | (User.username == normalized_username))
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("❌ El usuario ya existe en la base de datos")
            print(
                "Usuario existente:",
                {"id": existing_user.id, "username": existing_user.username, "email": existing_user.email},
            )
            return

        user = User(
            username=normalized_username,
            email=normalized_email,
            password=hash_password(password),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        print("✅ Usuario creado exitosamente:")
        print({"id": user.id, "username": user.username, "email": user.email, "createdAt": user.createdAt})


if __name__ == "__main__":
    asyncio.run(create_user())
