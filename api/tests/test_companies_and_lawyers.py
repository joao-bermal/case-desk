from sqlalchemy import select

from app.models import Case, User


def test_company_cnpj_is_validated_and_unique(client, world):
    def create(cnpj):
        return client.post(
            "/companies",
            json={"legal_name": "Gama Ltda", "cnpj": cnpj, "email": "g@gama.example"},
            headers=world.auth("secretary"),
        )

    assert create("11.222.333/0001-82").json()["errors"] == {
        "cnpj": "CNPJ inválido: dígitos verificadores não conferem."
    }
    duplicate = create("11.222.333/0001-81")
    assert duplicate.status_code == 409
    assert duplicate.json()["errors"] == {"cnpj": "Já existe uma empresa com este CNPJ."}
    created = create("12.ABC.345/01DE-35")
    assert created.status_code == 201
    assert created.json()["cnpj"] == "12ABC34501DE35"


def test_company_list_counts_cases(client, world):
    companies = client.get("/companies", headers=world.auth("lawyer")).json()
    by_name = {c["legal_name"]: c for c in companies}
    assert by_name["Alfa Comércio Ltda"]["active_cases"] == 1
    assert by_name["Beta Serviços Ltda"]["finished_cases"] == 1


def test_company_with_cases_cannot_be_deleted(client, world, db):
    path = f"/companies/{world.company.id}"
    assert client.delete(path, headers=world.auth("secretary")).status_code == 409

    db.delete(db.get(Case, world.case.id))
    db.commit()
    assert client.delete(path, headers=world.auth("secretary")).status_code == 204
    # Its client users go with it.
    assert db.scalar(select(User.id).where(User.id == world.client.id)) is None


def test_inviting_a_client_user(client, world, outbox):
    response = client.post(
        f"/companies/{world.company.id}/users",
        json={"full_name": "Duda Dias", "email": "Duda@Alfa.example"},
        headers=world.auth("secretary"),
    )
    assert response.status_code == 201
    assert response.json()["email"] == "duda@alfa.example"
    assert outbox[-1]["to"] == "duda@alfa.example"
    assert "/new-password?token=" in outbox[-1]["body"]

    taken = client.post(
        f"/companies/{world.company.id}/users",
        json={"full_name": "Outra Pessoa", "email": "lia@firm.example"},
        headers=world.auth("secretary"),
    )
    assert taken.status_code == 409
    assert taken.json()["errors"] == {"email": "Este e-mail já está em uso."}


def test_removing_a_client_user_checks_the_company(client, world):
    wrong = f"/companies/{world.other_company.id}/users/{world.client.id}"
    assert client.delete(wrong, headers=world.auth("secretary")).status_code == 404
    right = f"/companies/{world.company.id}/users/{world.client.id}"
    assert client.delete(right, headers=world.auth("secretary")).status_code == 204


def test_lawyer_with_active_cases_cannot_be_deactivated(client, world):
    response = client.patch(
        f"/lawyers/{world.lawyer.id}", json={"is_active": False}, headers=world.auth("secretary")
    )
    assert response.status_code == 409
    assert "Transfira os processos" in response.json()["detail"]


def test_deactivating_a_lawyer_ends_their_sessions(client, world):
    # other_lawyer's only case is closed, so the deactivation goes through.
    response = client.patch(
        f"/lawyers/{world.other_lawyer.id}",
        json={"is_active": False},
        headers=world.auth("secretary"),
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False
    assert client.get("/auth/me", headers=world.auth("other_lawyer")).status_code == 401
    # Inactive lawyers disappear from a colleague's list but not from the secretary's.
    colleagues = client.get("/lawyers", headers=world.auth("lawyer")).json()
    assert world.other_lawyer.id not in [lawyer["id"] for lawyer in colleagues]
    everyone = client.get("/lawyers", headers=world.auth("secretary")).json()
    assert world.other_lawyer.id in [lawyer["id"] for lawyer in everyone]


def test_lawyer_fields_are_normalized(client, world, outbox):
    response = client.post(
        "/lawyers",
        json={
            "full_name": "Rui Reis",
            "email": "rui@firm.example",
            "phone": "+55 11 3456-7890",
            "oab_number": "sp 123456",
        },
        headers=world.auth("secretary"),
    )
    assert response.status_code == 201
    assert response.json()["phone"] == "1134567890"
    assert response.json()["oab_number"] == "OAB/SP 123.456"


def test_resend_invite_only_for_people_without_a_password(client, world, outbox):
    created = client.post(
        "/lawyers",
        json={"full_name": "Téo Tavares", "email": "teo@firm.example"},
        headers=world.auth("secretary"),
    ).json()
    resend = client.post(f"/users/{created['id']}/invite", headers=world.auth("secretary"))
    assert resend.status_code == 202
    assert len(outbox) == 2
    has_password = client.post(f"/users/{world.lawyer.id}/invite", headers=world.auth("secretary"))
    assert has_password.status_code == 409
