from fastapi import APIRouter, HTTPException, status
from sqlalchemy import Select, func, select

from app import emails
from app.demo import enforce_cap, protect_demo_account
from app.deps import DB, CurrentUser, Secretary
from app.models import ACTIVE_STATUSES, Case, Role, TokenPurpose, User
from app.routers.companies import ensure_email_free
from app.schemas import LawyerIn, LawyerOut, LawyerUpdate
from app.security import end_sessions, issue_password_token

router = APIRouter(prefix="/lawyers", tags=["lawyers"])

NOT_FOUND = "Advogado não encontrado."


def _with_counts() -> Select:
    active = func.count(Case.id).filter(Case.status.in_(ACTIVE_STATUSES))
    return (
        select(User, active.label("active"))
        .outerjoin(Case, Case.lawyer_id == User.id)
        .where(User.role == Role.LAWYER)
        .group_by(User.id)
    )


def _out(row) -> LawyerOut:
    lawyer, active = row
    return LawyerOut.model_validate(lawyer).model_copy(update={"active_cases": active})


def _one(db: DB, lawyer_id: int) -> LawyerOut:
    row = db.execute(_with_counts().where(User.id == lawyer_id)).one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND)
    return _out(row)


@router.get("", response_model=list[LawyerOut])
def list_lawyers(user: CurrentUser, db: DB) -> list[LawyerOut]:
    """Secretary: everyone. Lawyer: active colleagues. Client: the lawyers on its cases."""
    query = _with_counts().order_by(User.full_name)
    if user.role is Role.LAWYER:
        query = query.where(User.is_active)
    elif user.role is Role.CLIENT:
        on_client_cases = select(Case.lawyer_id).where(Case.company_id == user.company_id)
        query = query.where(User.id.in_(on_client_cases))
    return [_out(row) for row in db.execute(query).all()]


@router.post("", response_model=LawyerOut, status_code=status.HTTP_201_CREATED)
def create_lawyer(payload: LawyerIn, _: Secretary, db: DB) -> LawyerOut:
    enforce_cap(db, User)
    ensure_email_free(db, payload.email)
    lawyer = User(**payload.model_dump(), role=Role.LAWYER)
    db.add(lawyer)
    db.flush()
    token = issue_password_token(db, lawyer, TokenPurpose.INVITE)
    db.commit()
    emails.send_invite(lawyer, token)
    return _one(db, lawyer.id)


@router.get("/{lawyer_id}", response_model=LawyerOut)
def get_lawyer(lawyer_id: int, _: Secretary, db: DB) -> LawyerOut:
    return _one(db, lawyer_id)


@router.patch("/{lawyer_id}", response_model=LawyerOut)
def update_lawyer(lawyer_id: int, payload: LawyerUpdate, _: Secretary, db: DB) -> LawyerOut:
    current = _one(db, lawyer_id)
    lawyer = db.get(User, lawyer_id)
    assert lawyer is not None  # noqa: S101
    protect_demo_account(lawyer)

    changes = payload.model_dump(exclude_unset=True)
    if changes.get("email"):
        ensure_email_free(db, changes["email"], lawyer_id)
    if changes.get("is_active") is False and lawyer.is_active:
        if current.active_cases:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Este advogado tem {current.active_cases} processo(s) em andamento. "
                "Transfira os processos antes de desativar o acesso.",
            )
        end_sessions(db, lawyer.id)

    for field in ("full_name", "email", "is_active"):
        if changes.get(field) is not None:
            setattr(lawyer, field, changes[field])
    for field in ("phone", "oab_number"):
        if field in changes:
            setattr(lawyer, field, changes[field])
    db.commit()
    return _one(db, lawyer_id)
