"""Validation errors as {field: message} in Portuguese, ready to show next to form fields."""

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

_MESSAGES = {
    "missing": "Campo obrigatório.",
    "string_too_short": "Mínimo de {min_length} caracteres.",
    "string_too_long": "Máximo de {max_length} caracteres.",
    "enum": "Opção inválida.",
    "int_parsing": "Informe um número.",
    "int_type": "Informe um número.",
    "bool_parsing": "Valor inválido.",
    "string_type": "Valor inválido.",
}


def _message(error: dict) -> str:
    kind = error.get("type", "")
    if kind == "value_error":
        message = str(error.get("msg", ""))
        if "email" in message.lower():
            return "E-mail inválido."
        return message.removeprefix("Value error, ")
    template = _MESSAGES.get(kind)
    if template:
        return template.format(**error.get("ctx", {}))
    return "Valor inválido."


def _field(location: tuple) -> str:
    parts = [str(p) for p in location if p not in ("body", "query", "path")]
    return ".".join(parts) or "_"


async def validation_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)  # noqa: S101
    errors: dict[str, str] = {}
    for error in exc.errors():
        errors.setdefault(_field(tuple(error.get("loc", ()))), _message(error))
    return JSONResponse(
        status_code=422,
        content={"detail": "Confira os campos destacados.", "errors": errors},
    )


class FieldError(Exception):
    """A business rule broken by one field, e.g. a CNPJ that is already registered."""

    def __init__(self, field: str, message: str, status_code: int = 409) -> None:
        super().__init__(message)
        self.field = field
        self.message = message
        self.status_code = status_code


async def field_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, FieldError)  # noqa: S101
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "errors": {exc.field: exc.message}},
    )
