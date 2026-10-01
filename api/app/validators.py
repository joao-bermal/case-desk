"""Brazilian document and phone formats. Values are stored as digits only."""

import re


def digits(value: str) -> str:
    return re.sub(r"\D", "", value)


_CNPJ = re.compile(r"^[0-9A-Z]{12}[0-9]{2}$")


def _cnpj_check_digit(base: str) -> str:
    # Each character counts as its ASCII code minus 48, so digits keep their value and
    # letters (alphanumeric CNPJ, IN RFB 2.229/2024) go from A=17 to Z=42.
    weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][-len(base) :]
    remainder = sum((ord(c) - 48) * w for c, w in zip(base, weights, strict=True)) % 11
    return "0" if remainder < 2 else str(11 - remainder)


def cnpj_with_check_digits(base12: str) -> str:
    first = _cnpj_check_digit(base12)
    return base12 + first + _cnpj_check_digit(base12 + first)


def normalize_cnpj(value: str) -> str:
    """Numeric or alphanumeric CNPJ, stored as 14 uppercase characters."""
    number = re.sub(r"[^0-9A-Za-z]", "", value).upper()
    if not _CNPJ.match(number) or len(set(number)) == 1:
        raise ValueError("CNPJ inválido.")
    if cnpj_with_check_digits(number[:12]) != number:
        raise ValueError("CNPJ inválido: dígitos verificadores não conferem.")
    return number


def normalize_phone(value: str | None) -> str | None:
    """Brazilian landline (10 digits) or mobile (11 digits), with area code."""
    if value is None or not value.strip():
        return None
    number = digits(value)
    if number.startswith("55") and len(number) in (12, 13):
        number = number[2:]
    if len(number) not in (10, 11) or number[0] == "0":
        raise ValueError("Telefone inválido: use DDD e número.")
    return number


_OAB = re.compile(r"^(?:OAB\s*/?\s*)?([A-Z]{2})\s*[-/]?\s*(\d{1,3})\.?(\d{3})$")


def normalize_oab(value: str | None) -> str | None:
    """OAB registration, stored as 'OAB/SP 123.456'."""
    if value is None or not value.strip():
        return None
    match = _OAB.match(value.strip().upper())
    if not match:
        raise ValueError("Número da OAB inválido. Exemplo: OAB/SP 123.456")
    state, thousands, units = match.groups()
    return f"OAB/{state} {thousands}.{units}"


def normalize_name(value: str) -> str:
    cleaned = " ".join(value.split())
    if len(cleaned) < 2:
        raise ValueError("Informe o nome.")
    return cleaned
