import pytest

from app.i18n import MESSAGES, parse_accept_language

EN = {"Accept-Language": "en-US,en;q=0.9"}


@pytest.mark.parametrize(
    ("header", "lang"),
    [
        ("en", "en"),
        ("en-US,en;q=0.9", "en"),
        ("pt-BR,pt;q=0.9", "pt"),
        ("", "pt"),
        (None, "pt"),
        ("fr-FR,en;q=0.5", "pt"),
    ],
)
def test_parse_accept_language(header, lang):
    assert parse_accept_language(header) == lang


def test_every_message_has_both_languages():
    for key, texts in MESSAGES.items():
        assert set(texts) == {"pt", "en"}, key
        assert all(texts.values()), key


def test_validation_errors_follow_accept_language(client, world):
    body = {"title": "x", "practice_area": "astrology"}
    pt = client.post("/cases", json=body, headers=world.auth("secretary")).json()
    en = client.post("/cases", json=body, headers={**world.auth("secretary"), **EN}).json()
    assert pt["detail"] == "Confira os campos destacados."
    assert en["detail"] == "Check the highlighted fields."
    assert en["errors"] == {
        "title": "At least 3 characters.",
        "practice_area": "Invalid option.",
        "company_id": "Required.",
    }


def test_validator_and_business_messages_in_english(client, world):
    headers = {**world.auth("secretary"), **EN}
    bad_cnpj = client.post(
        "/companies",
        json={"legal_name": "Gama Ltda", "cnpj": "11.222.333/0001-82", "email": "g@gama.example"},
        headers=headers,
    )
    assert bad_cnpj.json()["errors"] == {"cnpj": "Invalid CNPJ: the check digits do not match."}
    taken = client.post(
        "/companies",
        json={"legal_name": "Gama Ltda", "cnpj": "11.222.333/0001-81", "email": "g@gama.example"},
        headers=headers,
    )
    assert taken.json()["errors"] == {"cnpj": "A company with this CNPJ already exists."}
    assert (
        client.get("/auth/me", headers=EN).json()["detail"]
        == "Your session expired. Sign in again."
    )


def test_csv_export_in_english(client, world):
    text = client.get("/cases/export.csv", headers={**world.auth("client"), **EN}).content.decode()
    assert text.startswith("﻿ID;Title;Area;Status;Company;")
    assert "Labor;In progress" in text
