import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.core.security import (
    EMAIL_REGEX,
    USERNAME_REGEX,
    hash_password,
    normalize_email,
    normalize_username,
    validate_password_strength,
    verify_password,
)
from app.core.session import create_session, destroy_session, get_current_user_id
from app.database import get_db
from app.deps import require_user_id
from app.email import send_email, verification_email_html
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordBody,
    LoginBody,
    RegisterBody,
    ResendVerificationBody,
    UpdateProfileImageBody,
    VerifyEmailBody,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

VERIFICATION_CODE_EXPIRY_HOURS = 24
BASE64_IMAGE_REGEX = re.compile(r"^data:image/(png|jpeg|jpg|gif|webp);base64,")


def _generate_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _public_user(user: User) -> dict:
    return {"id": user.id, "username": user.username, "email": user.email}


@router.post("/login")
async def login(body: LoginBody, response: Response, db: AsyncSession = Depends(get_db)):
    if not body.usernameOrEmail or not body.password:
        raise ApiError(400, "Usuario/Email y contraseña son requeridos")

    is_email = bool(EMAIL_REGEX.match(body.usernameOrEmail))
    normalized_input = normalize_email(body.usernameOrEmail) if is_email else normalize_username(body.usernameOrEmail)

    result = await db.execute(
        select(User).where(User.email == normalized_input if is_email else User.username == normalized_input)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise ApiError(401, "Credenciales inválidas")

    if not user.emailVerified:
        raise ApiError(403, "Debes verificar tu correo electrónico para acceder", code="EMAIL_NOT_VERIFIED")

    await create_session(db, response, user.id)

    return {"message": "Login exitoso", "user": _public_user(user)}


@router.post("/register", status_code=201)
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db)):
    if not body.username or not body.email or not body.password:
        raise ApiError(400, "Todos los campos son requeridos")

    valid, error = validate_password_strength(body.password)
    if not valid:
        raise ApiError(400, error or "Contraseña inválida")

    normalized_email = normalize_email(body.email)
    normalized_username = normalize_username(body.username)

    if not EMAIL_REGEX.match(normalized_email):
        raise ApiError(400, "El formato del email no es válido")

    if not USERNAME_REGEX.match(normalized_username):
        raise ApiError(
            400,
            "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, "
            "números, guiones y guiones bajos",
        )

    existing_email = await db.execute(select(User).where(User.email == normalized_email))
    if existing_email.scalar_one_or_none():
        raise ApiError(400, "El email ya está registrado")

    existing_username = await db.execute(select(User).where(User.username == normalized_username))
    if existing_username.scalar_one_or_none():
        raise ApiError(400, "El nombre de usuario ya está en uso")

    verification_code = _generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_CODE_EXPIRY_HOURS)

    user = User(
        username=normalized_username,
        email=normalized_email,
        password=hash_password(body.password),
        emailVerified=False,
        emailVerificationToken=verification_code,
        emailVerificationTokenExpiresAt=expires_at,
    )
    db.add(user)
    await db.commit()

    subject = "Tu código de verificación — La voz de las páginas"
    html = verification_email_html(normalized_username, verification_code)
    # Fire-and-forget, matching backend-old which doesn't await the send result on register.
    await send_email(normalized_email, subject, html)

    return {"message": "Revisa tu correo para verificar tu cuenta", "needsVerification": True}


@router.post("/verify-email")
async def verify_email(body: VerifyEmailBody, response: Response, db: AsyncSession = Depends(get_db)):
    normalized_email = normalize_email((body.email or "").strip())
    code_str = "".join((body.code or "").strip().split())

    if not normalized_email or not code_str:
        raise ApiError(400, "Email y código son requeridos")

    if not code_str.isdigit() or len(code_str) != 6:
        raise ApiError(400, "El código debe tener 6 dígitos")

    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user:
        raise ApiError(400, "Código inválido o caducado")

    if user.emailVerified:
        await create_session(db, response, user.id)
        return {"message": "Tu cuenta ya está verificada.", "user": _public_user(user)}

    if not user.emailVerificationToken or user.emailVerificationToken != code_str:
        raise ApiError(400, "Código inválido o caducado")

    expires_at = user.emailVerificationTokenExpiresAt
    now = datetime.now(timezone.utc)
    if not expires_at or (expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at) < now:
        raise ApiError(400, "El código ha caducado. Solicita uno nuevo.")

    user.emailVerified = True
    user.emailVerificationToken = None
    user.emailVerificationTokenExpiresAt = None
    await db.commit()

    await create_session(db, response, user.id)

    return {"message": "Correo verificado correctamente", "user": _public_user(user)}


@router.post("/resend-verification")
async def resend_verification_email(body: ResendVerificationBody, db: AsyncSession = Depends(get_db)):
    normalized_email = normalize_email(body.email or "")
    if not normalized_email:
        raise ApiError(400, "El email es requerido")

    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user:
        raise ApiError(404, "No existe ninguna cuenta con ese correo")

    if user.emailVerified:
        raise ApiError(400, "Esta cuenta ya está verificada")

    verification_code = _generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_CODE_EXPIRY_HOURS)
    user.emailVerificationToken = verification_code
    user.emailVerificationTokenExpiresAt = expires_at
    await db.commit()

    subject = "Tu nuevo código de verificación — La voz de las páginas"
    html = verification_email_html(user.username, verification_code, is_resend=True)
    result_send = await send_email(normalized_email, subject, html)
    if not result_send.success:
        raise ApiError(500, "No se pudo enviar el correo. Inténtalo más tarde.")

    return {"message": "Se ha enviado un nuevo correo de verificación"}


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    await destroy_session(db, response, request)
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/me")
async def get_me(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    user_id = await get_current_user_id(request, db)
    if not user_id:
        return {"user": None}

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise ApiError(404, "Usuario no encontrado")

    if not user.emailVerified:
        await destroy_session(db, response, request)
        raise ApiError(403, "Debes verificar tu correo electrónico para acceder", code="EMAIL_NOT_VERIFIED")

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "profileImage": user.profileImage,
            "createdAt": user.createdAt,
        }
    }


@router.put("/profile-image")
async def update_profile_image(
    body: UpdateProfileImageBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.profileImage:
        raise ApiError(400, "No se proporcionó imagen")

    if not BASE64_IMAGE_REGEX.match(body.profileImage):
        raise ApiError(400, "Formato de imagen no válido")

    if len(body.profileImage) > 2 * 1024 * 1024 * 1.37:
        raise ApiError(400, "La imagen es demasiado grande (máximo 2MB)")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ApiError(404, "Usuario no encontrado")

    user.profileImage = body.profileImage
    await db.commit()

    return {
        "message": "Imagen de perfil actualizada",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "profileImage": user.profileImage,
            "createdAt": user.createdAt,
        },
    }


@router.put("/change-password")
async def change_password(
    body: ChangePasswordBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.currentPassword or not body.newPassword:
        raise ApiError(400, "Todos los campos son requeridos")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ApiError(404, "Usuario no encontrado")

    if not verify_password(body.currentPassword, user.password):
        raise ApiError(401, "La contraseña actual es incorrecta")

    if verify_password(body.newPassword, user.password):
        raise ApiError(400, "La nueva contraseña debe ser diferente a la actual")

    user.password = hash_password(body.newPassword)
    await db.commit()

    return {"message": "Contraseña actualizada exitosamente"}
