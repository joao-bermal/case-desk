from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.models import CaseStatus, PracticeArea, Role
from app.validators import normalize_cnpj, normalize_name, normalize_oab, normalize_phone

Name = Annotated[str, StringConstraints(max_length=150), AfterValidator(normalize_name)]
LegalName = Annotated[str, StringConstraints(max_length=200), AfterValidator(normalize_name)]
Phone = Annotated[str | None, AfterValidator(normalize_phone)]
Cnpj = Annotated[str, AfterValidator(normalize_cnpj)]
Oab = Annotated[str | None, AfterValidator(normalize_oab)]
Email = Annotated[EmailStr, AfterValidator(str.lower)]
Password = Annotated[str, StringConstraints(min_length=8, max_length=128)]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=200)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=5000)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth


class UserOut(ORMModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    role: Role
    oab_number: str | None
    company_id: int | None
    is_active: bool
    is_demo: bool
    has_password: bool


class LoginIn(BaseModel):
    email: Email
    password: str = Field(max_length=128)


class DemoLoginIn(BaseModel):
    role: Role


class SessionOut(BaseModel):
    token: str
    expires_at: datetime
    user: UserOut


class ProfileUpdate(BaseModel):
    full_name: Name | None = None
    phone: Phone = None


class PasswordChange(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: Password


class PasswordResetRequest(BaseModel):
    email: Email


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: Password


# Companies


class CompanyIn(BaseModel):
    legal_name: LegalName
    cnpj: Cnpj
    email: Email
    phone: Phone = None


class CompanyUpdate(BaseModel):
    legal_name: LegalName | None = None
    cnpj: Cnpj | None = None
    email: Email | None = None
    phone: Phone = None


class CompanyOut(ORMModel):
    id: int
    legal_name: str
    cnpj: str
    email: str
    phone: str | None
    created_at: datetime
    active_cases: int = 0
    finished_cases: int = 0


class ClientUserIn(BaseModel):
    full_name: Name
    email: Email
    phone: Phone = None


class ClientUserOut(ORMModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    is_active: bool
    is_demo: bool
    has_password: bool


class CompanyDetail(CompanyOut):
    users: list[ClientUserOut] = []


# Lawyers


class LawyerIn(BaseModel):
    full_name: Name
    email: Email
    phone: Phone = None
    oab_number: Oab = None


class LawyerUpdate(BaseModel):
    full_name: Name | None = None
    email: Email | None = None
    phone: Phone = None
    oab_number: Oab = None
    is_active: bool | None = None


class LawyerOut(ORMModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    oab_number: str | None
    is_active: bool
    is_demo: bool
    has_password: bool
    active_cases: int = 0


# Cases


class CompanyRef(ORMModel):
    id: int
    legal_name: str
    cnpj: str


class LawyerRef(ORMModel):
    id: int
    full_name: str
    email: str
    phone: str | None
    oab_number: str | None


class CaseIn(BaseModel):
    title: Title
    practice_area: PracticeArea
    status: CaseStatus = CaseStatus.OPEN
    description: Description = ""
    company_id: int
    # Lawyers always create cases for themselves; the secretary picks the lawyer.
    lawyer_id: int | None = None


class CaseUpdate(BaseModel):
    title: Title | None = None
    practice_area: PracticeArea | None = None
    status: CaseStatus | None = None
    description: Description | None = None
    company_id: int | None = None
    lawyer_id: int | None = None


class CaseOut(ORMModel):
    id: int
    title: str
    practice_area: PracticeArea
    status: CaseStatus
    description: str
    company: CompanyRef
    lawyer: LawyerRef
    created_at: datetime
    updated_at: datetime


class CaseCounts(BaseModel):
    open: int = 0
    in_progress: int = 0
    closed: int = 0
    archived: int = 0


class CaseList(BaseModel):
    items: list[CaseOut]
    # Totals per status for everything the user can see, ignoring the filters.
    counts: CaseCounts


class Message(BaseModel):
    detail: str


class BulkDeleted(BaseModel):
    deleted: int


class ValidationErrorOut(BaseModel):
    detail: str
    errors: dict[str, str]
