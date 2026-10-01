from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app import emails
from app.config import get_settings
from app.demo import protect_demo_account
from app.deps import DB, CurrentSession, CurrentUser
from app.i18n import t
from app.models import TokenPurpose, User
from app.schemas import (
    DemoLoginIn,
    LoginIn,
    Message,
    PasswordChange,
    PasswordResetConfirm,
    PasswordResetRequest,
    ProfileUpdate,
    SessionOut,
    UserOut,
)
from app.security import (
    create_session,
    end_sessions,
    hash_password,
    issue_password_token,
    needs_rehash,
    now,
    redeem_password_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _session_out(db: DB, user: User) -> SessionOut:
    token, session = create_session(db, user)
    db.commit()
    return SessionOut(token=token, expires_at=session.expires_at, user=UserOut.model_validate(user))


@router.post("/login", response_model=SessionOut)
def login(payload: LoginIn, db: DB) -> SessionOut:
    settings = get_settings()
    user = db.scalar(select(User).where(User.email == payload.email))

    if user is not None and user.locked_until is not None and user.locked_until > now():
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            t("locked"),
        )

    password_ok = verify_password(user.password_hash if user else None, payload.password)
    if user is None or not password_ok or not user.is_active:
        if user is not None:
            user.failed_logins += 1
            if user.failed_logins >= settings.max_failed_logins:
                user.locked_until = now() + timedelta(minutes=settings.lockout_minutes)
                user.failed_logins = 0
            db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, t("invalid_login"))

    user.failed_logins = 0
    user.locked_until = None
    if user.password_hash and needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
    return _session_out(db, user)


@router.post(
    "/demo-login",
    response_model=SessionOut,
    summary="Sign in with a shared demo account (demo mode only)",
)
def demo_login(payload: DemoLoginIn, db: DB) -> SessionOut:
    if not get_settings().demo_mode:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")
    user = db.scalar(
        select(User)
        .where(User.is_demo, User.is_active, User.role == payload.role)
        .order_by(User.id)
    )
    if user is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            t("demo_restarting"),
        )
    return _session_out(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(session: CurrentSession, db: DB) -> None:
    db.delete(session)
    db.commit()


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserOut)
def update_me(payload: ProfileUpdate, user: CurrentUser, db: DB) -> User:
    protect_demo_account(user)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("full_name"):
        user.full_name = changes["full_name"]
    if "phone" in changes:
        user.phone = changes["phone"]
    db.commit()
    return user


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: PasswordChange, session: CurrentSession, db: DB) -> None:
    user = session.user
    protect_demo_account(user)
    if not verify_password(user.password_hash, payload.current_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, t("wrong_current_password"))
    user.password_hash = hash_password(payload.new_password)
    # Other devices signed in with the old password are signed out.
    end_sessions(db, user.id, keep=session)
    db.commit()


@router.post("/password-reset", status_code=status.HTTP_202_ACCEPTED, response_model=Message)
def request_password_reset(payload: PasswordResetRequest, db: DB) -> Message:
    # Same answer whether or not the email exists, so the form cannot list accounts.
    answer = Message(detail=t("reset_sent"))
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not user.is_active or user.is_demo:
        return answer

    token = issue_password_token(db, user, TokenPurpose.RESET)
    db.commit()
    emails.send_password_reset(user, token)
    return answer


@router.post("/password-reset/confirm", response_model=SessionOut)
def confirm_password_reset(payload: PasswordResetConfirm, db: DB) -> SessionOut:
    """Sets the password from an invite or reset link and signs the person in."""
    user = redeem_password_token(db, payload.token)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, t("link_invalid"))
    user.password_hash = hash_password(payload.new_password)
    user.failed_logins = 0
    user.locked_until = None
    end_sessions(db, user.id)
    return _session_out(db, user)
