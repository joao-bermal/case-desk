import logging
import os
import smtplib
from email.message import EmailMessage

from app.config import get_settings
from app.i18n import current_lang
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


_INVITE = {
    "pt": (
        "Seu acesso ao Case Desk",
        "Olá, {name}.\n\nVocê recebeu acesso ao Case Desk. Para criar sua senha, abra o link "
        "abaixo:\n\n{link}\n\nO link vale por {hours} horas e só pode ser usado uma vez.\n",
    ),
    "en": (
        "Your Case Desk access",
        "Hello, {name}.\n\nYou now have access to Case Desk. To set your password, open the "
        "link below:\n\n{link}\n\nThe link works for {hours} hours and only once.\n",
    ),
}

_RESET = {
    "pt": (
        "Redefinição de senha do Case Desk",
        "Olá, {name}.\n\nRecebemos um pedido para redefinir a sua senha. Para criar uma nova, "
        "abra o link:\n\n{link}\n\nO link vale por {minutes} minutos. Se você não fez o "
        "pedido, ignore este e-mail.\n",
    ),
    "en": (
        "Case Desk password reset",
        "Hello, {name}.\n\nWe got a request to reset your password. To set a new one, open "
        "the link:\n\n{link}\n\nThe link works for {minutes} minutes. If you did not ask "
        "for it, ignore this email.\n",
    ),
}


def _link(token: str) -> str:
    return f"{get_settings().web_base_url}/new-password?token={token}"


def send_invite(user: User, token: str) -> None:
    # Written in the language of whoever sent the invite, like the screens they use.
    subject, body = _INVITE[current_lang.get()]
    hours = get_settings().invite_token_ttl_hours
    send_email(
        user.email, subject, body.format(name=user.full_name, link=_link(token), hours=hours)
    )


def send_password_reset(user: User, token: str) -> None:
    subject, body = _RESET[current_lang.get()]
    minutes = get_settings().reset_token_ttl_minutes
    send_email(
        user.email, subject, body.format(name=user.full_name, link=_link(token), minutes=minutes)
    )
