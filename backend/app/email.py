"""Email sending: Resend (HTTPS API) when RESEND_API_KEY is set, otherwise SMTP.

Mirrors backend-old/src/lib/email.ts.
"""

import logging
from dataclasses import dataclass

import aiosmtplib
import resend
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from starlette.concurrency import run_in_threadpool

from app.config import settings

logger = logging.getLogger("app.email")

SMTP_CONNECTION_TIMEOUT_SECONDS = 15
FROM_DISPLAY_NAME = "La voz de las páginas"


@dataclass
class SendEmailResult:
    success: bool
    message_id: str | None = None
    error: str | None = None


def _use_resend() -> bool:
    return bool(settings.resend_api_key and settings.resend_api_key.strip())


def _from_address() -> str:
    return settings.email_from or settings.smtp_user or "onboarding@resend.dev"


async def _send_email_resend(to: str, subject: str, html_body: str) -> SendEmailResult:
    api_key = (settings.resend_api_key or "").strip()
    if not api_key:
        return SendEmailResult(success=False, error="RESEND_API_KEY no configurado")

    from_address = _from_address()
    resend.api_key = api_key

    try:
        response = await run_in_threadpool(
            resend.Emails.send,
            {
                "from": f'"{FROM_DISPLAY_NAME}" <{from_address}>',
                "to": [to],
                "subject": subject,
                "html": html_body,
            },
        )
        message_id = response.get("id") if isinstance(response, dict) else None
        logger.info("[Email] Enviado (Resend): to=%s subject=%s messageId=%s", to, subject, message_id)
        return SendEmailResult(success=True, message_id=message_id)
    except Exception as err:  # noqa: BLE001 - mirrors the JS try/catch around the Resend SDK call
        logger.error("[Email] Resend exception: to=%s subject=%s error=%s", to, subject, err)
        return SendEmailResult(success=False, error=str(err))


async def _send_email_smtp(to: str, subject: str, html_body: str) -> SendEmailResult:
    if not settings.smtp_user or not settings.smtp_pass:
        logger.warning("[Email] SMTP no configurado: faltan SMTP_USER o SMTP_PASS. Los correos no se enviarán.")
        return SendEmailResult(success=False, error="SMTP no configurado")

    from_address = settings.email_from or settings.smtp_user
    if not from_address:
        logger.error("[Email] EMAIL_FROM o SMTP_USER no definido.")
        return SendEmailResult(success=False, error="Remitente no configurado")

    message = MIMEMultipart("alternative")
    message["From"] = f'"{FROM_DISPLAY_NAME}" <{from_address}>'
    message["To"] = to
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            use_tls=settings.smtp_secure,
            username=settings.smtp_user,
            password=settings.smtp_pass,
            timeout=SMTP_CONNECTION_TIMEOUT_SECONDS,
        )
        logger.info("[Email] Enviado (SMTP): to=%s subject=%s", to, subject)
        return SendEmailResult(success=True)
    except Exception as err:  # noqa: BLE001 - mirrors the JS try/catch around nodemailer's sendMail
        logger.error("[Email] SMTP error: to=%s subject=%s error=%s", to, subject, err)
        return SendEmailResult(success=False, error=str(err))


async def send_email(to: str, subject: str, html_body: str) -> SendEmailResult:
    if _use_resend():
        return await _send_email_resend(to, subject, html_body)
    return await _send_email_smtp(to, subject, html_body)


def verification_email_html(username: str, code: str, *, is_resend: bool = False) -> str:
    intro = "Tu nuevo código de verificación es" if is_resend else "Tu código de verificación para <strong>La voz de las páginas</strong> es"
    footer = "Si no fuiste tú, puedes ignorar este mensaje." if is_resend else "Si no creaste esta cuenta, puedes ignorar este mensaje."
    return f"""
      <h2>Hola, {username}</h2>
      <p>{intro}:</p>
      <p style="font-size:1.5rem;font-weight:700;letter-spacing:0.3em;margin:1rem 0;">{code}</p>
      <p>Introduce este código en la web{"" if is_resend else " para activar tu cuenta"}. El código caduca en 24 horas.</p>
      <p>{footer}</p>
      <p>— El equipo</p>
    """
