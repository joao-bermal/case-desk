"""Who can do what. Each row is (role, method, path, body, expected status).

`{case}` is a case of the lawyer and client under test; `{other_case}` belongs to another
lawyer and another company. Out-of-scope reads answer 404, never 403, so ids leak nothing.
"""

import pytest

CASE_BODY = {"title": "Novo processo", "practice_area": "civil", "company_id": "{company}"}
COMPANY_BODY = {"legal_name": "Gama Ltda", "cnpj": "12ABC34501DE35", "email": "g@gama.example"}
LAWYER_BODY = {"full_name": "Nova Advogada", "email": "nova@firm.example"}
CLIENT_BODY = {"full_name": "Novo Cliente", "email": "novo@alfa.example"}

MATRIX = [
    # Cases: read
    ("secretary", "GET", "/cases/{case}", None, 200),
    ("secretary", "GET", "/cases/{other_case}", None, 200),
    ("lawyer", "GET", "/cases/{case}", None, 200),
    ("lawyer", "GET", "/cases/{other_case}", None, 404),
    ("client", "GET", "/cases/{case}", None, 200),
    ("client", "GET", "/cases/{other_case}", None, 404),
    # Cases: create
    ("secretary", "POST", "/cases", {**CASE_BODY, "lawyer_id": "{lawyer}"}, 201),
    ("lawyer", "POST", "/cases", CASE_BODY, 201),
    ("lawyer", "POST", "/cases", {**CASE_BODY, "lawyer_id": "{other_lawyer}"}, 403),
    ("client", "POST", "/cases", CASE_BODY, 403),
    # Cases: update
    ("secretary", "PATCH", "/cases/{other_case}", {"status": "archived"}, 200),
    ("lawyer", "PATCH", "/cases/{case}", {"status": "closed"}, 200),
    ("lawyer", "PATCH", "/cases/{other_case}", {"status": "closed"}, 404),
    ("lawyer", "PATCH", "/cases/{case}", {"lawyer_id": "{other_lawyer}"}, 403),
    ("secretary", "PATCH", "/cases/{case}", {"lawyer_id": "{other_lawyer}"}, 200),
    ("client", "PATCH", "/cases/{case}", {"status": "closed"}, 403),
    # Cases: delete
    ("secretary", "DELETE", "/cases/{case}", None, 204),
    ("lawyer", "DELETE", "/cases/{case}", None, 403),
    ("client", "DELETE", "/cases/{case}", None, 403),
    # Companies
    ("secretary", "GET", "/companies", None, 200),
    ("lawyer", "GET", "/companies", None, 200),
    ("client", "GET", "/companies", None, 403),
    ("client", "GET", "/companies/{company}", None, 200),
    ("client", "GET", "/companies/{other_company}", None, 404),
    ("secretary", "POST", "/companies", COMPANY_BODY, 201),
    ("lawyer", "POST", "/companies", COMPANY_BODY, 403),
    ("client", "POST", "/companies", COMPANY_BODY, 403),
    ("lawyer", "PATCH", "/companies/{company}", {"legal_name": "Outro nome"}, 403),
    ("client", "PATCH", "/companies/{company}", {"legal_name": "Outro nome"}, 403),
    ("lawyer", "DELETE", "/companies/{company}", None, 403),
    ("secretary", "POST", "/companies/{company}/users", CLIENT_BODY, 201),
    ("lawyer", "POST", "/companies/{company}/users", CLIENT_BODY, 403),
    ("client", "POST", "/companies/{company}/users", CLIENT_BODY, 403),
    # Lawyers
    ("secretary", "POST", "/lawyers", LAWYER_BODY, 201),
    ("lawyer", "POST", "/lawyers", LAWYER_BODY, 403),
    ("client", "POST", "/lawyers", LAWYER_BODY, 403),
    ("lawyer", "GET", "/lawyers/{other_lawyer}", None, 403),
    ("lawyer", "PATCH", "/lawyers/{other_lawyer}", {"full_name": "Hackeado"}, 403),
    ("client", "PATCH", "/lawyers/{lawyer}", {"is_active": False}, 403),
    # Users
    ("lawyer", "POST", "/users/{other_lawyer}/invite", None, 403),
    ("client", "POST", "/users/{client}/invite", None, 403),
]


def _fill(value, ids):
    if isinstance(value, str) and value.startswith("{") and value.endswith("}"):
        return ids[value[1:-1]]
    if isinstance(value, dict):
        return {k: _fill(v, ids) for k, v in value.items()}
    return value


@pytest.mark.parametrize(("role", "method", "path", "body", "expected"), MATRIX)
def test_permission_matrix(client, world, outbox, role, method, path, body, expected):
    ids = {
        "case": world.case.id,
        "other_case": world.other_case.id,
        "company": world.company.id,
        "other_company": world.other_company.id,
        "lawyer": world.lawyer.id,
        "other_lawyer": world.other_lawyer.id,
        "client": world.client.id,
    }
    response = client.request(
        method, path.format(**ids), json=_fill(body, ids), headers=world.auth(role)
    )
    assert response.status_code == expected, response.text


@pytest.mark.parametrize(
    "path", ["/cases", "/cases/1", "/companies", "/lawyers", "/auth/me", "/cases/export.csv"]
)
def test_every_data_route_requires_a_session(client, world, path):
    assert client.get(path).status_code == 401
    assert client.get(path, headers={"Authorization": "Bearer not-a-token"}).status_code == 401


def test_lists_are_scoped_per_role(client, world):
    def titles(role):
        response = client.get("/cases", headers=world.auth(role))
        return {c["title"] for c in response.json()["items"]}

    assert titles("secretary") == {world.case.title, world.other_case.title}
    assert titles("lawyer") == {world.case.title}
    assert titles("client") == {world.case.title}
    assert titles("other_client") == {world.other_case.title}


def test_client_sees_only_the_lawyers_on_its_cases(client, world):
    response = client.get("/lawyers", headers=world.auth("client"))
    assert [lawyer["id"] for lawyer in response.json()] == [world.lawyer.id]


def test_company_detail_shows_users_only_to_the_secretary(client, world):
    path = f"/companies/{world.company.id}"
    assert len(client.get(path, headers=world.auth("secretary")).json()["users"]) == 1
    assert client.get(path, headers=world.auth("client")).json()["users"] == []
