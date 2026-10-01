import pytest
from sqlalchemy import func, select

from app.models import Case, Role, User
from app.seed import reset_demo_data
from tests.conftest import PASSWORD


@pytest.fixture
def demo(db, settings, monkeypatch):
    monkeypatch.setattr(settings, "demo_mode", True)
    monkeypatch.setattr(settings, "cron_secret", "cron-test-secret")
    reset_demo_data(db)


def demo_auth(client, role: str) -> dict[str, str]:
    response = client.post("/auth/demo-login", json={"role": role})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_demo_login_is_off_outside_demo_mode(client, world):
    assert client.post("/auth/demo-login", json={"role": "secretary"}).status_code == 404
    assert client.get("/demo/reset").status_code == 404


@pytest.mark.parametrize("role", [r.value for r in Role])
def test_demo_login_for_each_role(client, demo, role):
    me = client.get("/auth/me", headers=demo_auth(client, role)).json()
    assert me["role"] == role
    assert me["is_demo"] is True


def test_demo_accounts_cannot_be_taken_over(client, demo, db):
    secretary = demo_auth(client, "secretary")
    lawyer = demo_auth(client, "lawyer")
    demo_lawyer = db.scalar(select(User).where(User.is_demo, User.role == Role.LAWYER))

    assert (
        client.post(
            "/auth/password",
            json={"current_password": "x", "new_password": "new password"},
            headers=lawyer,
        ).status_code
        == 409
    )
    assert client.patch("/auth/me", json={"full_name": "Outro"}, headers=lawyer).status_code == 409
    assert (
        client.patch(
            f"/lawyers/{demo_lawyer.id}", json={"email": "me@evil.example"}, headers=secretary
        ).status_code
        == 409
    )
    # No demo account has a password, so the password form cannot reach them either.
    assert (
        client.post(
            "/auth/login", json={"email": demo_lawyer.email, "password": PASSWORD}
        ).status_code
        == 401
    )


def test_demo_caps_creation(client, demo, db, monkeypatch):
    from app import demo as demo_module

    monkeypatch.setitem(demo_module._CAPS, "cases", db.scalar(select(func.count(Case.id))))
    company_id = db.scalar(select(Case.company_id))
    response = client.post(
        "/cases",
        json={"title": "Mais um", "practice_area": "civil", "company_id": company_id},
        headers=demo_auth(client, "lawyer"),
    )
    assert response.status_code == 409
    assert "limite" in response.json()["detail"]


def test_reset_endpoint_needs_the_cron_secret(client, demo, db):
    assert client.get("/demo/reset").status_code == 401
    assert client.get("/demo/reset", headers={"Authorization": "Bearer wrong"}).status_code == 401

    db.execute(Case.__table__.delete())
    db.commit()
    ok = client.get("/demo/reset", headers={"Authorization": "Bearer cron-test-secret"})
    assert ok.status_code == 200
    assert db.scalar(select(func.count(Case.id))) == 16
