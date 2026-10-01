"""Writes the OpenAPI schema the web app generates its types from.

uv run python scripts/export_openapi.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app

TARGET = Path(__file__).resolve().parents[2] / "web" / "src" / "lib" / "api" / "openapi.json"

if __name__ == "__main__":
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n", "utf-8")
    print(f"Wrote {TARGET}")
