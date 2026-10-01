from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AuthSession, Role, User
from app.security import find_session

_bearer = HTTPBearer(auto_error=False, description="Session token from POST /auth/login")

DB = Annotated[Session, Depends(get_db)]


def get_auth_session(
    db: DB,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> AuthSession:
    session = find_session(db, credentials.credentials) if credentials else None
    if session is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Sessão expirada. Entre novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return session


CurrentSession = Annotated[AuthSession, Depends(get_auth_session)]


def get_current_user(session: CurrentSession) -> User:
    return session.user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: Role) -> Callable[[User], User]:
    def check(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Seu perfil não tem acesso a esta ação.")
        return user

    return check


Secretary = Annotated[User, Depends(require_roles(Role.SECRETARY))]
Staff = Annotated[User, Depends(require_roles(Role.SECRETARY, Role.LAWYER))]
