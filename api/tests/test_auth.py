import re
from datetime import timedelta

from sqlalchemy import func, select

from app.models import AuthSession, PasswordToken, User
from app.security import now
from tests.conftest import PASSWORD


def login(client, email, password=PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


def token_from(outbox) -> str:
    match = re.search(r"token=([\w-]+)", outbox[-1]["body"])
    assert match, outbox[-1]["body"]
    return match.group(1)


def test_login_returns_a_session_and_never_the_password(client, world):
    response = login(client, "LIA@firm.example")
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "lia@firm.example"
    assert "password_hash" not in body["user"]
    assert "$argon2" not in response.text
    assert PASSWORD not in response.text
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.json()["id"] == world.lawyer.id


def test_password_is_stored_hashed(db, world):
    stored = db.scalar(select(User.password_hash).where(User.id == world.lawyer.id))
    assert stored.startswith("$argon2id$")
    assert PASSWORD not in stored


def test_wrong_password_and_unknown_email_look_the_same(client, world):
    wrong = login(client, "lia@firm.example", "wrong password")
    unknown = login(client, "nobody@firm.example")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_account_locks_after_repeated_failures(client, world, db):
    for _ in range(5):
        assert login(client, "lia@firm.example", "wrong password").status_code == 401
    assert login(client, "lia@firm.example").status_code == 429
    db.expire_all()
    user = db.get(User, world.lawyer.id)
    user.locked_until = now() - timedelta(seconds=1)
    db.commit()
    assert login(client, "lia@firm.example").status_code == 200


def test_inactive_user_cannot_sign_in(client, world, db):
    db.get(User, world.lawyer.id).is_active = False
    db.commit()
    assert login(client, "lia@firm.example").status_code == 401
    assert client.get("/auth/me", headers=world.auth("lawyer")).status_code == 401


def test_logout_revokes_the_token(client, world):
    assert client.post("/auth/logout", headers=world.auth("lawyer")).status_code == 204
    assert client.get("/auth/me", headers=world.auth("lawyer")).status_code == 401


def test_expired_session_is_rejected(client, world, db):
    for session in db.scalars(select(AuthSession)):
        session.expires_at = now() - timedelta(minutes=1)
    db.commit()
    assert client.get("/auth/me", headers=world.auth("lawyer")).status_code == 401


def test_change_password_needs_the_current_one_and_signs_out_other_devices(client, world):
    other_device = login(client, "lia@firm.example").json()["token"]
    wrong = client.post(
        "/auth/password",
        json={"current_password": "nope", "new_password": "a brand new secret"},
        headers=world.auth("lawyer"),
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/auth/password",
        json={"current_password": PASSWORD, "new_password": "a brand new secret"},
        headers=world.auth("lawyer"),
    )
    assert ok.status_code == 204
    assert client.get("/auth/me", headers=world.auth("lawyer")).status_code == 200
    assert (
        client.get("/auth/me", headers={"Authorization": f"Bearer {other_device}"}).status_code
        == 401
    )
    assert login(client, "lia@firm.example", "a brand new secret").status_code == 200


def test_password_reset_answers_the_same_for_unknown_emails(client, world, outbox):
    known = client.post("/auth/password-reset", json={"email": "lia@firm.example"})
    unknown = client.post("/auth/password-reset", json={"email": "nobody@firm.example"})
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()
    assert len(outbox) == 1
    # The link goes by email only; the API response never carries it.
    assert token_from(outbox) not in known.text


def test_reset_link_sets_the_password_once(client, world, outbox, db):
    client.post("/auth/password-reset", json={"email": "lia@firm.example"})
    token = token_from(outbox)
    stored = db.scalar(select(PasswordToken.token_hash))
    assert token not in stored

    first = client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "reset via email"}
    )
    assert first.status_code == 200
    assert first.json()["user"]["id"] == world.lawyer.id
    # Every session from before the reset is gone.
    assert client.get("/auth/me", headers=world.auth("lawyer")).status_code == 401

    again = client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "second attempt"}
    )
    assert again.status_code == 400
    assert login(client, "lia@firm.example", "reset via email").status_code == 200


def test_only_the_newest_reset_link_works(client, world, outbox):
    client.post("/auth/password-reset", json={"email": "lia@firm.example"})
    old = token_from(outbox)
    client.post("/auth/password-reset", json={"email": "lia@firm.example"})
    new = token_from(outbox)
    body = {"new_password": "whatever works"}
    assert (
        client.post("/auth/password-reset/confirm", json={"token": old, **body}).status_code == 400
    )
    assert (
        client.post("/auth/password-reset/confirm", json={"token": new, **body}).status_code == 200
    )


def test_expired_reset_link_is_rejected(client, world, outbox, db):
    client.post("/auth/password-reset", json={"email": "lia@firm.example"})
    token = token_from(outbox)
    for record in db.scalars(select(PasswordToken)):
        record.expires_at = now() - timedelta(minutes=1)
    db.commit()
    response = client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "too late now"}
    )
    assert response.status_code == 400


def test_invite_link_lets_a_new_lawyer_set_a_password(client, world, outbox, db):
    created = client.post(
        "/lawyers",
        json={"full_name": "Nina Nova", "email": "nina@firm.example"},
        headers=world.auth("secretary"),
    )
    assert created.status_code == 201
    assert created.json()["has_password"] is False
    assert outbox[-1]["to"] == "nina@firm.example"
    assert login(client, "nina@firm.example", "").status_code in (401, 422)

    response = client.post(
        "/auth/password-reset/confirm",
        json={"token": token_from(outbox), "new_password": "nina's own secret"},
    )
    assert response.status_code == 200
    assert login(client, "nina@firm.example", "nina's own secret").status_code == 200
    assert db.scalar(select(func.count()).select_from(PasswordToken)) == 1


def test_short_password_is_rejected_in_portuguese(client, world):
    response = client.post(
        "/auth/password",
        json={"current_password": PASSWORD, "new_password": "short"},
        headers=world.auth("lawyer"),
    )
    assert response.status_code == 422
    assert response.json()["errors"] == {"new_password": "Mínimo de 8 caracteres."}


def test_profile_update(client, world):
    response = client.patch(
        "/auth/me",
        json={"full_name": "  Lia   Souza ", "phone": "(12) 99876-5432"},
        headers=world.auth("lawyer"),
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Lia Souza"
    assert response.json()["phone"] == "12998765432"
