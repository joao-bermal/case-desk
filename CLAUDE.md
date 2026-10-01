# Case Desk

- `api/`: FastAPI with uv. Tests need the local database: `docker compose up -d`, then `uv run pytest`, `uv run ruff check .` and `uv run ruff format --check .`.
- `web/`: Next.js 16. Read `web/AGENTS.md` before changing it. After any change to the API schemas or routes, run `npm run gen:api` and commit the regenerated `src/lib/api/` files.
- Every permission rule lives in the API. When adding a route, add its rows to `api/tests/test_permissions.py`.
- Interface text is Brazilian Portuguese; code, comments, commits and docs are English. No em or en dashes in interface text or docs.
- Demo data (`api/app/seed.py`) stays fictional: `.example` emails, no phone numbers, CNPJs with the `DEMO` root.
- Both Vercel projects deploy from `main` on the Hobby plan: commit as `37602245+joao-bermal@users.noreply.github.com` (set in the repo config) and never add a `Co-Authored-By` trailer, or Vercel blocks the deploy.
