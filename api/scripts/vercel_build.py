"""Vercel build step for the API project.

Production builds apply the migrations, and in demo mode load the demo data when the
database is still empty. Preview builds skip both, so a branch never migrates production.
"""

import os
import subprocess
import sys
from pathlib import Path

# Run as a file, so the API root is not on the path by default.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def main() -> None:
    environment = os.environ.get("VERCEL_ENV", "local")
    if environment != "production":
        print(f"VERCEL_ENV={environment}: skipping migrations.")
        return

    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)

    from sqlalchemy import func, select

    from app.config import get_settings
    from app.db import SessionLocal
    from app.models import User
    from app.seed import reset_demo_data

    if not get_settings().demo_mode:
        return
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(User)):
            reset_demo_data(db)
            print("Demo data loaded.")


if __name__ == "__main__":
    main()
