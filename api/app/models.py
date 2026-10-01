from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, TimestampMixin


class Role(StrEnum):
    SECRETARY = "secretary"
    LAWYER = "lawyer"
    CLIENT = "client"


class CaseStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    ARCHIVED = "archived"


ACTIVE_STATUSES = (CaseStatus.OPEN, CaseStatus.IN_PROGRESS)
FINISHED_STATUSES = (CaseStatus.CLOSED, CaseStatus.ARCHIVED)


class PracticeArea(StrEnum):
    CIVIL = "civil"
    LABOR = "labor"
    TAX = "tax"
    CORPORATE = "corporate"
    CONSUMER = "consumer"
    INTELLECTUAL_PROPERTY = "intellectual_property"


class TokenPurpose(StrEnum):
    INVITE = "invite"
    RESET = "reset"


def _enum(enum_cls: type[StrEnum], name: str) -> Enum:
    # Stored as VARCHAR plus an explicit CHECK (see _one_of): adding a value is a plain
    # migration, with no Postgres enum type to alter.
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        length=30,
        values_callable=lambda members: [m.value for m in members],
    )


def _one_of(column: str, enum_cls: type[StrEnum]) -> CheckConstraint:
    values = ", ".join(f"'{member.value}'" for member in enum_cls)
    return CheckConstraint(f"{column} IN ({values})", name=f"{column}_valid")


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    legal_name: Mapped[str] = mapped_column(String(200))
    cnpj: Mapped[str] = mapped_column(String(14), unique=True)
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str | None] = mapped_column(String(11))

    users: Mapped[list["User"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", passive_deletes=True
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        _one_of("role", Role),
        CheckConstraint("(role = 'client') = (company_id IS NOT NULL)", name="client_has_company"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    # Null until the person accepts the invite and picks a password.
    password_hash: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(String(11))
    role: Mapped[Role] = mapped_column(_enum(Role, "role"))
    oab_number: Mapped[str | None] = mapped_column(String(20))
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    # Shared demo accounts: reachable through the demo sign-in, credentials locked.
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    failed_logins: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    company: Mapped[Company | None] = relationship(back_populates="users")

    @property
    def has_password(self) -> bool:
        return self.password_hash is not None


class Case(TimestampMixin, Base):
    __tablename__ = "cases"
    __table_args__ = (
        _one_of("practice_area", PracticeArea),
        _one_of("status", CaseStatus),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    practice_area: Mapped[PracticeArea] = mapped_column(_enum(PracticeArea, "practice_area"))
    status: Mapped[CaseStatus] = mapped_column(
        _enum(CaseStatus, "case_status"), default=CaseStatus.OPEN
    )
    description: Mapped[str] = mapped_column(Text, default="")
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="RESTRICT"), index=True
    )
    lawyer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)

    company: Mapped[Company] = relationship(lazy="joined")
    lawyer: Mapped[User] = relationship(lazy="joined")


class AuthSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # SHA-256 of the bearer token; the token itself is never stored.
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(lazy="joined")


class PasswordToken(Base):
    __tablename__ = "password_tokens"
    __table_args__ = (_one_of("purpose", TokenPurpose),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    purpose: Mapped[TokenPurpose] = mapped_column(_enum(TokenPurpose, "token_purpose"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(lazy="joined")
