import logging

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

from app.deps import DB
from app.errors import FieldError, field_error_handler, validation_exception_handler
from app.routers import auth, cases, companies, demo, lawyers, users

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Case Desk API",
    version="2.0.0",
    summary="Case management for a law office: companies, lawyers and their cases.",
    description=(
        "Three roles share one API. The **secretary** manages everything, a **lawyer** works "
        "on the cases assigned to them, and a **client** follows its company's cases. "
        "Authenticate with `POST /auth/login` and send the token as `Authorization: Bearer`."
    ),
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(FieldError, field_error_handler)

for module in (auth, cases, companies, lawyers, users, demo):
    app.include_router(module.router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"name": "Case Desk API", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health(db: DB) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
