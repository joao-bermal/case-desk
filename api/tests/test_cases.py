from app.models import Case


def test_lawyer_creates_cases_in_their_own_name(client, world):
    response = client.post(
        "/cases",
        json={
            "title": "Revisão contratual",
            "practice_area": "corporate",
            "company_id": world.company.id,
        },
        headers=world.auth("lawyer"),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["lawyer"]["id"] == world.lawyer.id
    assert body["status"] == "open"
    assert body["company"]["legal_name"] == "Alfa Comércio Ltda"


def test_secretary_must_pick_a_lawyer(client, world):
    response = client.post(
        "/cases",
        json={"title": "Sem advogado", "practice_area": "civil", "company_id": world.company.id},
        headers=world.auth("secretary"),
    )
    assert response.status_code == 422
    assert response.json()["errors"] == {"lawyer_id": "Escolha o advogado responsável."}


def test_cases_cannot_point_at_missing_or_wrong_records(client, world):
    def create(**overrides):
        body = {
            "title": "Teste",
            "practice_area": "civil",
            "company_id": world.company.id,
            "lawyer_id": world.lawyer.id,
            **overrides,
        }
        return client.post("/cases", json=body, headers=world.auth("secretary"))

    assert create(company_id=9999).json()["errors"] == {"company_id": "Empresa não encontrada."}
    # A client user is not a lawyer, even with a valid user id.
    assert create(lawyer_id=world.client.id).json()["errors"] == {
        "lawyer_id": "Escolha um advogado ativo."
    }


def test_validation_errors_name_each_field(client, world):
    response = client.post(
        "/cases",
        json={"title": "x", "practice_area": "astrology"},
        headers=world.auth("secretary"),
    )
    assert response.status_code == 422
    assert response.json()["errors"] == {
        "title": "Mínimo de 3 caracteres.",
        "practice_area": "Opção inválida.",
        "company_id": "Campo obrigatório.",
    }


def test_secretary_transfers_a_case(client, world):
    response = client.patch(
        f"/cases/{world.case.id}",
        json={"lawyer_id": world.other_lawyer.id},
        headers=world.auth("secretary"),
    )
    assert response.json()["lawyer"]["id"] == world.other_lawyer.id
    # The previous lawyer loses access with the transfer.
    assert client.get(f"/cases/{world.case.id}", headers=world.auth("lawyer")).status_code == 404


def test_lawyer_updates_their_case(client, world, db):
    response = client.patch(
        f"/cases/{world.case.id}",
        json={"status": "closed", "description": "Acordo homologado."},
        headers=world.auth("lawyer"),
    )
    assert response.status_code == 200
    db.expire_all()
    case = db.get(Case, world.case.id)
    assert (case.status, case.description) == ("closed", "Acordo homologado.")


def test_filters_counts_and_search(client, world):
    def get(**params):
        return client.get("/cases", params=params, headers=world.auth("secretary")).json()

    everything = get()
    assert everything["counts"] == {"open": 0, "in_progress": 1, "closed": 1, "archived": 0}
    assert [c["id"] for c in get(group="active")["items"]] == [world.case.id]
    assert [c["id"] for c in get(group="finished")["items"]] == [world.other_case.id]
    assert [c["id"] for c in get(status="closed")["items"]] == [world.other_case.id]
    assert [c["id"] for c in get(q="beta")["items"]] == [world.other_case.id]
    assert [c["id"] for c in get(q="audiência")["items"]] == [world.case.id]
    # Counts describe everything visible, not the filtered page.
    assert get(group="active")["counts"] == everything["counts"]


def test_counts_are_scoped(client, world):
    counts = client.get("/cases", headers=world.auth("client")).json()["counts"]
    assert counts == {"open": 0, "in_progress": 1, "closed": 0, "archived": 0}


def test_csv_export_opens_in_excel(client, world):
    response = client.get("/cases/export.csv", headers=world.auth("client"))
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    text = response.content.decode("utf-8")
    assert text.startswith("﻿ID;Título;")
    lines = text.strip().splitlines()
    assert len(lines) == 2  # header plus the client's single case
    assert "Ação trabalhista da Alfa;Trabalhista;Em andamento;Alfa Comércio Ltda" in lines[1]
    assert "Beta" not in text
