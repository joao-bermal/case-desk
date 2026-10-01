from fastapi import APIRouter, HTTPException, status
from sqlalchemy import Select, func, select

from app import emails
from app.demo import enforce_cap, protect_demo_account
from app.deps import DB, CurrentUser, Secretary, Staff
from app.errors import FieldError
from app.i18n import t
from app.models import (
    ACTIVE_STATUSES,
    FINISHED_STATUSES,
    Case,
    Company,
    Role,
    TokenPurpose,
    User,
)
from app.schemas import (
    ClientUserIn,
    ClientUserOut,
    CompanyDetail,
    CompanyIn,
    CompanyOut,
    CompanyUpdate,
)
from app.security import issue_password_token

router = APIRouter(prefix="/companies", tags=["companies"])


def _with_counts() -> Select:
    active = func.count(Case.id).filter(Case.status.in_(ACTIVE_STATUSES))
    finished = func.count(Case.id).filter(Case.status.in_(FINISHED_STATUSES))
    return (
        select(Company, active.label("active"), finished.label("finished"))
        .outerjoin(Case, Case.company_id == Company.id)
        .group_by(Company.id)
    )


def _out(row) -> CompanyOut:
    company, active, finished = row
    return CompanyOut.model_validate(company).model_copy(
        update={"active_cases": active, "finished_cases": finished}
    )


def _get(db: DB, company_id: int) -> Company:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("company_not_found"))
    return company


def _ensure_cnpj_free(db: DB, cnpj: str, company_id: int | None = None) -> None:
    query = select(Company.id).where(Company.cnpj == cnpj)
    if company_id is not None:
        query = query.where(Company.id != company_id)
    if db.scalar(query) is not None:
        raise FieldError("cnpj", t("cnpj_taken"))


def ensure_email_free(db: DB, email: str, user_id: int | None = None) -> None:
    query = select(User.id).where(User.email == email)
    if user_id is not None:
        query = query.where(User.id != user_id)
    if db.scalar(query) is not None:
        raise FieldError("email", t("email_taken"))


@router.get("", response_model=list[CompanyOut])
def list_companies(_: Staff, db: DB) -> list[CompanyOut]:
    rows = db.execute(_with_counts().order_by(Company.legal_name)).all()
    return [_out(row) for row in rows]


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyIn, _: Secretary, db: DB) -> CompanyOut:
    enforce_cap(db, Company)
    _ensure_cnpj_free(db, payload.cnpj)
    company = Company(**payload.model_dump())
    db.add(company)
    db.commit()
    return CompanyOut.model_validate(company)


@router.get("/{company_id}", response_model=CompanyDetail)
def get_company(company_id: int, user: CurrentUser, db: DB) -> CompanyDetail:
    # Clients only see their own company, and a miss looks the same as a missing id.
    if user.role is Role.CLIENT and user.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("company_not_found"))
    row = db.execute(_with_counts().where(Company.id == company_id)).one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("company_not_found"))
    detail = CompanyDetail(**_out(row).model_dump())
    if user.role is Role.SECRETARY:
        users = db.scalars(
            select(User).where(User.company_id == company_id).order_by(User.full_name)
        )
        detail.users = [ClientUserOut.model_validate(u) for u in users]
    return detail


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, payload: CompanyUpdate, _: Secretary, db: DB) -> CompanyOut:
    company = _get(db, company_id)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("cnpj"):
        _ensure_cnpj_free(db, changes["cnpj"], company_id)
    for field in ("legal_name", "cnpj", "email"):
        if changes.get(field):
            setattr(company, field, changes[field])
    if "phone" in changes:
        company.phone = changes["phone"]
    db.commit()
    return _out(db.execute(_with_counts().where(Company.id == company_id)).one())


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, _: Secretary, db: DB) -> None:
    company = _get(db, company_id)
    if db.scalar(select(Case.id).where(Case.company_id == company_id).limit(1)) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            t("company_has_cases"),
        )
    for user in company.users:
        protect_demo_account(user)
    db.delete(company)
    db.commit()


@router.post(
    "/{company_id}/users", response_model=ClientUserOut, status_code=status.HTTP_201_CREATED
)
def invite_client_user(company_id: int, payload: ClientUserIn, _: Secretary, db: DB) -> User:
    """Gives someone at the client company read access to its cases, by email invite."""
    _get(db, company_id)
    enforce_cap(db, User)
    ensure_email_free(db, payload.email)
    user = User(**payload.model_dump(), role=Role.CLIENT, company_id=company_id)
    db.add(user)
    db.flush()
    token = issue_password_token(db, user, TokenPurpose.INVITE)
    db.commit()
    emails.send_invite(user, token)
    return user


@router.delete("/{company_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_client_user(company_id: int, user_id: int, _: Secretary, db: DB) -> None:
    user = db.get(User, user_id)
    if user is None or user.company_id != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("access_not_found"))
    protect_demo_account(user)
    db.delete(user)
    db.commit()
