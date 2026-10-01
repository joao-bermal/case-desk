# Case Desk

- `api/`: FastAPI with uv. Tests need the local database: `docker compose up -d`, then `uv run pytest`, `uv run ruff check .` and `uv run ruff format --check .`.
- `web/`: Next.js 16. Read `web/AGENTS.md` before changing it. After any change to the API schemas or routes, run `npm run gen:api` and commit the regenerated `src/lib/api/` files.
- MUI theme (`web/src/theme.ts`): grid colors go in `palette.DataGrid`, never as a background in `MuiDataGrid.styleOverrides.root`, which also styles the grid's scroll shadow layer and paints over the rows. Grids pass `localeText={gridLocale({...})}`, because a plain `localeText` prop drops the Portuguese translations.
- Every permission rule lives in the API. When adding a route, add its rows to `api/tests/test_permissions.py`.
- The interface is bilingual. Web copy lives in `web/src/content/*.ts` (`Record<Locale, ...>`, never inline strings in components); API messages live in `api/app/i18n.py` with both languages. Routes are English. Code, comments, commits and docs are English. No em or en dashes in interface text or docs.
- Demo records stay in Portuguese (a Brazilian office); the English sign in page explains CNPJ and OAB.
- Demo data (`api/app/seed.py`) stays fictional: `.example` emails, no phone numbers, CNPJs with the `DEMO` root.
- Both Vercel projects deploy from `main` on the Hobby plan: commit as `37602245+joao-bermal@users.noreply.github.com` (set in the repo config) and never add a `Co-Authored-By` trailer, or Vercel blocks the deploy.
