from fastapi import APIRouter, HTTPException, status

from app import emails
from app.demo import protect_demo_account
from app.deps import DB, Secretary
from app.models import TokenPurpose, User
from app.schemas import Message
from app.security import issue_password_token

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/{user_id}/invite", status_code=status.HTTP_202_ACCEPTED, response_model=Message)
def resend_invite(user_id: int, _: Secretary, db: DB) -> Message:
    """Sends a fresh invite link to a lawyer or client who has not set a password yet."""
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pessoa não encontrada.")
    protect_demo_account(user)
    if user.has_password:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Esta pessoa já criou a senha. Se esqueceu, ela pode usar o 'Esqueci a senha'.",
        )
    token = issue_password_token(db, user, TokenPurpose.INVITE)
    db.commit()
    emails.send_invite(user, token)
    return Message(detail=f"Convite reenviado para {user.email}.")
