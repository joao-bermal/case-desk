import secrets
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status

from app.config import get_settings
from app.deps import DB
from app.schemas import Message
from app.seed import reset_demo_data

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/reset", response_model=Message, summary="Daily demo reset (Vercel Cron)")
def reset(db: DB, authorization: Annotated[str | None, Header()] = None) -> Message:
    settings = get_settings()
    if not settings.demo_mode:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")
    expected = f"Bearer {settings.cron_secret}"
    if not settings.cron_secret or not secrets.compare_digest(authorization or "", expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized")
    reset_demo_data(db)
    return Message(detail="Demo data reset.")
