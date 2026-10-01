import pytest

from app.validators import (
    cnpj_with_check_digits,
    normalize_cnpj,
    normalize_oab,
    normalize_phone,
)


@pytest.mark.parametrize(
    ("raw", "stored"),
    [
        ("11.222.333/0001-81", "11222333000181"),
        ("11222333000181", "11222333000181"),
        # Alphanumeric example published by Receita Federal.
        ("12.ABC.345/01DE-35", "12ABC34501DE35"),
        ("12abc34501de35", "12ABC34501DE35"),
    ],
)
def test_valid_cnpj(raw, stored):
    assert normalize_cnpj(raw) == stored


@pytest.mark.parametrize(
    "raw", ["11.222.333/0001-80", "00000000000000", "1122233300018", "12ABC34501DEAB", ""]
)
def test_invalid_cnpj(raw):
    with pytest.raises(ValueError, match="CNPJ"):
        normalize_cnpj(raw)


def test_demo_cnpjs_are_valid():
    assert normalize_cnpj(cnpj_with_check_digits("DEMO00010001")) == "DEMO0001000107"


@pytest.mark.parametrize(
    ("raw", "stored"),
    [
        ("(12) 99876-5432", "12998765432"),
        ("+55 11 3456-7890", "1134567890"),
        ("", None),
        (None, None),
    ],
)
def test_phone(raw, stored):
    assert normalize_phone(raw) == stored


@pytest.mark.parametrize("raw", ["99876-5432", "(01) 3456-7890", "123"])
def test_invalid_phone(raw):
    with pytest.raises(ValueError, match="Telefone"):
        normalize_phone(raw)


@pytest.mark.parametrize(
    ("raw", "stored"),
    [
        ("OAB/SP 123.456", "OAB/SP 123.456"),
        ("sp123456", "OAB/SP 123.456"),
        ("RJ 98.765", "OAB/RJ 98.765"),
        ("", None),
    ],
)
def test_oab(raw, stored):
    assert normalize_oab(raw) == stored


def test_invalid_oab():
    with pytest.raises(ValueError, match="OAB"):
        normalize_oab("123456")
