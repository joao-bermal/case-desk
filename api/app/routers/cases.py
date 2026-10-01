import csv
import io
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import ColumnElement, func, or_, select

from app.demo import enforce_cap
from app.deps import DB, CurrentUser, Secretary, Staff
from app.errors import FieldError
from app.labels import PRACTICE_AREA, STATUS, format_cnpj
from app.models import (
    ACTIVE_STATUSES,
    FINISHED_STATUSES,
    Case,
    CaseStatus,
    Company,
    Role,
    User,
)
from app.schemas import CaseCounts, CaseIn, CaseList, CaseOut, CaseUpdate

router = APIRouter(prefix="/cases", tags=["cases"])

NOT_FOUND = "Processo não encontrado."
UNPROCESSABLE = 422


def _scope(user: User) -> list[ColumnElement[bool]]:
    """The cases each role may see. Everything else behaves as if it did not exist."""
    if user.role is Role.LAWYER:
        return [Case.lawyer_id == user.id]
    if user.role is Role.CLIENT:
        return [Case.company_id == user.company_id]
    return []


def _filters(
    user: User,
    status_: list[CaseStatus] | None,
    group: str | None,
    q: str | None,
    company_id: int | None,
    lawyer_id: int | None,
) -> list[ColumnElement[bool]]:
    conditions = _scope(user)
    if status_:
        conditions.append(Case.status.in_(status_))
    if group == "active":
        conditions.append(Case.status.in_(ACTIVE_STATUSES))
    elif group == "finished":
        conditions.append(Case.status.in_(FINISHED_STATUSES))
    if q:
        pattern = f"%{q.strip()}%"
        conditions.append(
            or_(
                Case.title.ilike(pattern),
                Case.description.ilike(pattern),
                Case.company.has(Company.legal_name.ilike(pattern)),
            )
        )
    if company_id is not None:
        conditions.append(Case.company_id == company_id)
    if lawyer_id is not None:
        conditions.append(Case.lawyer_id == lawyer_id)
    return conditions


StatusFilter = Annotated[list[CaseStatus] | None, Query(alias="status")]
GroupFilter = Annotated[Literal["active", "finished"] | None, Query()]
SearchFilter = Annotated[str | None, Query(max_length=100)]


def _get_scoped(db: DB, user: User, case_id: int) -> Case:
    case = db.scalar(select(Case).where(Case.id == case_id, *_scope(user)))
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND)
    return case


def _check_company(db: DB, company_id: int) -> None:
    if db.get(Company, company_id) is None:
        raise FieldError("company_id", "Empresa não encontrada.", UNPROCESSABLE)


def _check_lawyer(db: DB, lawyer_id: int) -> None:
    lawyer = db.get(User, lawyer_id)
    if lawyer is None or lawyer.role is not Role.LAWYER or not lawyer.is_active:
        raise FieldError("lawyer_id", "Escolha um advogado ativo.", UNPROCESSABLE)


@router.get("", response_model=CaseList)
def list_cases(
    user: CurrentUser,
    db: DB,
    status_: StatusFilter = None,
    group: GroupFilter = None,
    q: SearchFilter = None,
    company_id: int | None = None,
    lawyer_id: int | None = None,
) -> CaseList:
    conditions = _filters(user, status_, group, q, company_id, lawyer_id)
    cases = db.scalars(select(Case).where(*conditions).order_by(Case.updated_at.desc())).all()

    totals = db.execute(
        select(Case.status, func.count()).where(*_scope(user)).group_by(Case.status)
    ).all()
    counts = CaseCounts(**{status_value.value: total for status_value, total in totals})
    return CaseList(items=[CaseOut.model_validate(c) for c in cases], counts=counts)


@router.get(
    "/export.csv",
    response_class=Response,
    responses={200: {"content": {"text/csv": {}}}},
    summary="Export the visible cases as CSV (semicolon separated, opens in Excel)",
)
def export_cases(
    user: CurrentUser,
    db: DB,
    status_: StatusFilter = None,
    group: GroupFilter = None,
    q: SearchFilter = None,
    company_id: int | None = None,
    lawyer_id: int | None = None,
) -> Response:
    conditions = _filters(user, status_, group, q, company_id, lawyer_id)
    cases = db.scalars(select(Case).where(*conditions).order_by(Case.id)).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(
        [
            "ID",
            "Título",
            "Área",
            "Status",
            "Empresa",
            "CNPJ",
            "Advogado",
            "Criado em",
            "Atualizado em",
            "Descrição",
        ]
    )
    for case in cases:
        writer.writerow(
            [
                case.id,
                case.title,
                PRACTICE_AREA[case.practice_area],
                STATUS[case.status],
                case.company.legal_name,
                format_cnpj(case.company.cnpj),
                case.lawyer.full_name,
                case.created_at.strftime("%d/%m/%Y"),
                case.updated_at.strftime("%d/%m/%Y"),
                case.description,
            ]
        )
    # The BOM makes Excel read the file as UTF-8 instead of mangling the accents.
    return Response(
        content="﻿" + buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="processos.csv"'},
    )


@router.post("", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseIn, user: Staff, db: DB) -> Case:
    enforce_cap(db, Case)
    data = payload.model_dump()
    if user.role is Role.LAWYER:
        if data["lawyer_id"] not in (None, user.id):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "Advogados só abrem processos em seu próprio nome."
            )
        data["lawyer_id"] = user.id
    elif data["lawyer_id"] is None:
        raise FieldError("lawyer_id", "Escolha o advogado responsável.", UNPROCESSABLE)
    _check_company(db, data["company_id"])
    _check_lawyer(db, data["lawyer_id"])

    case = Case(**data)
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, user: CurrentUser, db: DB) -> Case:
    return _get_scoped(db, user, case_id)


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(case_id: int, payload: CaseUpdate, user: Staff, db: DB) -> Case:
    case = _get_scoped(db, user, case_id)
    changes = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}

    if "lawyer_id" in changes and changes["lawyer_id"] != case.lawyer_id:
        if user.role is not Role.SECRETARY:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "Só a secretaria pode transferir um processo."
            )
        _check_lawyer(db, changes["lawyer_id"])
    if "company_id" in changes and changes["company_id"] != case.company_id:
        _check_company(db, changes["company_id"])

    for field, value in changes.items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: int, user: Secretary, db: DB) -> None:
    db.delete(_get_scoped(db, user, case_id))
    db.commit()
