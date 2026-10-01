import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AuthSession, PasswordToken, TokenPurpose, User

_hasher = PasswordHasher()
# Verified when the email does not exist, so a miss costs as much as a wrong password.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))


def now() -> datetime:
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except (VerificationError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _new_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)


# Sessions


def create_session(db: Session, user: User) -> tuple[str, AuthSession]:
    token, token_hash = _new_token()
    expires_at = now() + timedelta(hours=get_settings().session_ttl_hours)
    session = AuthSession(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.add(session)
    # Housekeeping: expired sessions have no use and would pile up.
    db.execute(delete(AuthSession).where(AuthSession.expires_at < now()))
    return token, session


def find_session(db: Session, token: str) -> AuthSession | None:
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.expires_at <= now() or not session.user.is_active:
        return None
    return session


def end_sessions(db: Session, user_id: int, keep: AuthSession | None = None) -> None:
    query = delete(AuthSession).where(AuthSession.user_id == user_id)
    if keep is not None:
        query = query.where(AuthSession.id != keep.id)
    db.execute(query)


# Invite and password reset links


def issue_password_token(db: Session, user: User, purpose: TokenPurpose) -> str:
    settings = get_settings()
    ttl = (
        timedelta(hours=settings.invite_token_ttl_hours)
        if purpose is TokenPurpose.INVITE
        else timedelta(minutes=settings.reset_token_ttl_minutes)
    )
    # Only the newest link works.
    db.execute(
        update(PasswordToken)
        .where(PasswordToken.user_id == user.id, PasswordToken.used_at.is_(None))
        .values(used_at=now())
    )
    token, token_hash = _new_token()
    db.add(
        PasswordToken(
            user_id=user.id, token_hash=token_hash, purpose=purpose, expires_at=now() + ttl
        )
    )
    return token


def redeem_password_token(db: Session, token: str) -> User | None:
    record = db.scalar(
        select(PasswordToken)
        .where(PasswordToken.token_hash == hash_token(token))
        .with_for_update(of=PasswordToken)
    )
    if record is None or record.used_at is not None or record.expires_at <= now():
        return None
    if not record.user.is_active or record.user.is_demo:
        return None
    record.used_at = now()
    return record.user
