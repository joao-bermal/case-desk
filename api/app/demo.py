"""Guards for the public demo, where anyone can sign in with the shared accounts."""

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import Base
from app.models import User

# Generous for a visit, small enough that nobody can fill the database before the reset.
_CAPS = {"cases": 150, "companies": 40, "users": 40}


def enforce_cap(db: Session, model: type[Base]) -> None:
    if not get_settings().demo_mode:
        return
    cap = _CAPS[model.__tablename__]
    if (db.scalar(select(func.count()).select_from(model)) or 0) >= cap:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"A demo chegou ao limite de {cap} registros deste tipo. "
            "Os dados voltam ao original todos os dias.",
        )


def protect_demo_account(user: User) -> None:
    if user.is_demo:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "As contas de demonstração não podem ser alteradas. "
            "Crie um cadastro novo para testar esta ação.",
        )
