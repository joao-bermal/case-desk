import logging
import os
import smtplib
from email.message import EmailMessage

from app.config import get_settings
from app.models import User

logger = logging.getLogger("case_desk.emails")


def send_email(to: str, subject: str, body: str) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        # Locally the link is printed so the flow can be followed; deployed logs keep only
        # the envelope, because the body carries a one-time password link.
        if os.environ.get("VERCEL"):
            logger.warning("Email not sent (SMTP_HOST is empty). To: %s | %s", to, subject)
        else:
            logger.warning(
                "Email not sent (SMTP_HOST is empty). To: %s | %s\n%s", to, subject, body
            )
        return

    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    # A mail outage must not fail the request that triggered it; the link can be resent.
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_starttls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError):
        logger.exception("Could not send email to %s | %s", to, subject)


def send_invite(user: User, token: str) -> None:
    link = f"{get_settings().web_base_url}/nova-senha?token={token}"
    hours = get_settings().invite_token_ttl_hours
    send_email(
        user.email,
        "Seu acesso ao Case Desk",
        f"Olá, {user.full_name}.\n\n"
        "Você recebeu acesso ao Case Desk. Para criar sua senha, abra o link abaixo:\n\n"
        f"{link}\n\n"
        f"O link vale por {hours} horas e só pode ser usado uma vez.\n",
    )


def send_password_reset(user: User, token: str) -> None:
    link = f"{get_settings().web_base_url}/nova-senha?token={token}"
    minutes = get_settings().reset_token_ttl_minutes
    send_email(
        user.email,
        "Redefinição de senha do Case Desk",
        f"Olá, {user.full_name}.\n\n"
        "Recebemos um pedido para redefinir a sua senha. Para criar uma nova, abra o link:\n\n"
        f"{link}\n\n"
        f"O link vale por {minutes} minutos. Se você não fez o pedido, ignore este e-mail.\n",
    )
