import os
from dataclasses import dataclass

# Point the app at the test database before anything imports the settings.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://casedesk:casedesk@localhost:5433/casedesk_test"
)
os.environ["DEMO_MODE"] = "false"
os.environ["SMTP_HOST"] = ""

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text

from app import emails
from app.config import get_settings
from app.db import SessionLocal, engine
from app.main import app
from app.models import Case, CaseStatus, Company, PracticeArea, Role, User
from app.security import create_session, hash_password
from app.validators import cnpj_with_check_digits

PASSWORD = "correct horse battery"


@pytest.fixture(scope="session", autouse=True)
def schema():
    """Runs the real migrations, down and up, so a broken migration fails the suite."""
    config = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    yield
    engine.dispose()


@pytest.fixture
def db():
    with SessionLocal() as session:
        yield session


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def outbox(monkeypatch):
    sent: list[dict] = []
    monkeypatch.setattr(
        emails,
        "send_email",
        lambda to, subject, body: sent.append({"to": to, "subject": subject, "body": body}),
    )
    return sent


@pytest.fixture
def settings(monkeypatch):
    """The cached settings object; tests flip flags with monkeypatch.setattr."""
    return get_settings()


@dataclass
class World:
    secretary: User
    lawyer: User
    other_lawyer: User
    company: Company
    other_company: Company
    client: User
    other_client: User
    case: Case
    other_case: Case
    tokens: dict[str, str]

    def auth(self, who: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.tokens[who]}"}


@pytest.fixture
def world(db) -> World:
    """Two companies, each with a client user and a case handled by a different lawyer."""
    db.execute(
        text("TRUNCATE password_tokens, sessions, cases, users, companies RESTART IDENTITY CASCADE")
    )
    company = Company(
        legal_name="Alfa Comércio Ltda",
        cnpj=cnpj_with_check_digits("112223330001"),
        email="contato@alfa.example",
    )
    other_company = Company(
        legal_name="Beta Serviços Ltda",
        cnpj=cnpj_with_check_digits("TEST00020001"),
        email="contato@beta.example",
    )
    db.add_all([company, other_company])
    db.flush()

    def person(name: str, email: str, role: Role, company_id: int | None = None) -> User:
        user = User(
            full_name=name,
            email=email,
            role=role,
            company_id=company_id,
            password_hash=hash_password(PASSWORD),
        )
        db.add(user)
        return user

    secretary = person("Sara Secretária", "sara@firm.example", Role.SECRETARY)
    lawyer = person("Lia Advogada", "lia@firm.example", Role.LAWYER)
    other_lawyer = person("Otto Advogado", "otto@firm.example", Role.LAWYER)
    client = person("Caio Cliente", "caio@alfa.example", Role.CLIENT, company.id)
    other_client = person("Bia Cliente", "bia@beta.example", Role.CLIENT, other_company.id)
    db.flush()

    case = Case(
        title="Ação trabalhista da Alfa",
        practice_area=PracticeArea.LABOR,
        status=CaseStatus.IN_PROGRESS,
        description="Audiência marcada.",
        company_id=company.id,
        lawyer_id=lawyer.id,
    )
    other_case = Case(
        title="Contrato da Beta",
        practice_area=PracticeArea.CORPORATE,
        status=CaseStatus.CLOSED,
        description="Assinado.",
        company_id=other_company.id,
        lawyer_id=other_lawyer.id,
    )
    db.add_all([case, other_case])
    db.flush()

    tokens = {}
    for key, user in {
        "secretary": secretary,
        "lawyer": lawyer,
        "other_lawyer": other_lawyer,
        "client": client,
        "other_client": other_client,
    }.items():
        tokens[key], _ = create_session(db, user)
    db.commit()

    return World(
        secretary,
        lawyer,
        other_lawyer,
        company,
        other_company,
        client,
        other_client,
        case,
        other_case,
        tokens,
    )
