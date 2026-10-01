"""Operator commands.

uv run python -m app.cli create-user --role secretary --name "Maria Souza" --email m@x.com
uv run python -m app.cli seed-demo --yes
"""

import argparse
import sys

from pydantic import TypeAdapter, ValidationError
from sqlalchemy import select

from app.config import get_settings
from app.db import SessionLocal
from app.models import Role, TokenPurpose, User
from app.schemas import Email, Name
from app.security import issue_password_token
from app.seed import reset_demo_data


def create_user(role: Role, name: str, email: str) -> None:
    try:
        name = TypeAdapter(Name).validate_python(name)
        email = TypeAdapter(Email).validate_python(email)
    except ValidationError as exc:
        sys.exit(f"Invalid input: {exc.errors()[0]['msg']}")
    if role is Role.CLIENT:
        sys.exit("Client users belong to a company: invite them from the company page.")

    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.email == email)):
            sys.exit(f"{email} is already registered.")
        user = User(full_name=name, email=email, role=role)
        db.add(user)
        db.flush()
        token = issue_password_token(db, user, TokenPurpose.INVITE)
        db.commit()
    # Printed instead of emailed: this command bootstraps the first secretary.
    print(f"Created {role.value} {email}. Set the password at:")
    print(f"{get_settings().web_base_url}/nova-senha?token={token}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    commands = parser.add_subparsers(dest="command", required=True)

    create = commands.add_parser("create-user", help="Create a secretary or lawyer")
    create.add_argument("--role", choices=[Role.SECRETARY.value, Role.LAWYER.value], required=True)
    create.add_argument("--name", required=True)
    create.add_argument("--email", required=True)

    seed = commands.add_parser("seed-demo", help="Erase every row and load the demo data")
    seed.add_argument("--yes", action="store_true", help="Confirm that all data will be erased")

    args = parser.parse_args()
    if args.command == "create-user":
        create_user(Role(args.role), args.name, args.email)
    elif args.command == "seed-demo":
        if not args.yes:
            sys.exit("This erases every row. Run again with --yes to confirm.")
        with SessionLocal() as db:
            reset_demo_data(db)
        print("Demo data loaded.")


if __name__ == "__main__":
    main()
