# Case Desk

Case management for a Brazilian law office. The secretary registers client companies and lawyers and assigns the cases, each lawyer works on the cases in their name, and the people at each client company follow their own cases. A FastAPI service owns the data and every permission check; a Next.js app is the interface.

**Live demo:** _link after the first deploy_. Pick a role on the sign in page; the fictional data resets every day.

**Design:** [docs/TDD.md](docs/TDD.md) covers the architecture, data model, authentication, the permission rules, the demo mode, deployment and testing.

The interface is in Brazilian Portuguese because the domain is Brazilian (CNPJ, OAB, the legal vocabulary). Code and documentation are in English.

## From the 2022 version

Case Desk started in 2022 as my college project, under a name the course assigned ("Top Serviços"). That version is kept at the tag [`v1-2022`](../../tree/v1-2022). In 2026 I rewrote it with what I now consider the baseline for software that holds other people's data:

| 2022 | 2026 |
|---|---|
| The API had no authentication: anyone could list or delete every record | Every data route needs a session, roles are checked on the server, and a permission matrix test checks the three roles against them |
| Passwords stored in plain text, and returned by the login and list endpoints | Argon2id hashes that no endpoint returns |
| "Signed in" meant a user object in `localStorage` | Opaque session tokens, stored as SHA-256 hashes, revocable, kept in an httpOnly cookie |
| Password reset sent a 4 digit code that the API also returned, with no expiry | Single use links by email, stored hashed, valid for 30 minutes, with the same answer for unknown emails |
| Anyone could sign up as the secretary, which was the admin role | Access by invite only: the secretary invites lawyers and client users |
| Cases linked to companies and lawyers by CNPJ and CPF strings | Integer foreign keys with explicit `RESTRICT` and `CASCADE` rules |
| Credentials written in the source code | Settings from environment variables |
| Create React App, Electron, Material UI v4 and v5 side by side | Next.js 16 (App Router, Server Actions), Tailwind CSS 4, a typed API client generated from the OpenAPI schema |
| Unpinned `requirements.txt` and deleted migrations | `uv` with a lockfile and Alembic migrations that the test suite runs down and up |
| No tests | 112 pytest tests against a real Postgres |

## Roles

| | Secretary | Lawyer | Client |
|---|---|---|---|
| Cases | Sees, creates, edits, transfers and deletes all | Sees and edits the cases in their name; opens new ones for themselves | Reads the cases of their company |
| Companies | Creates, edits and deletes; invites and removes client users | Reads the list and contacts | Reads their own company |
| Lawyers | Invites, edits, deactivates | Reads active colleagues | Reads the lawyers on their cases |
| CSV export | All cases | Their cases | Their company's cases |

A record outside a user's scope answers 404, the same as a record that does not exist, so ids reveal nothing.

## How it works

```
Browser ──> Next.js (web/)            ──> FastAPI (api/)        ──> Postgres
            server components,             bearer token,            constraints,
            server actions,                role checks,             foreign keys
            httpOnly session cookie        validation, emails
```

1. The sign in form posts to a Next.js server action, which calls `POST /auth/login` and stores the returned token in an httpOnly, `SameSite=Lax` cookie. Browser code never sees the token.
2. Pages are server components. They read the cookie and call the API with `Authorization: Bearer`, through a client typed from the API's OpenAPI schema.
3. The API resolves the session, loads the user, and scopes every query to what that role may see. Forms send their changes through server actions, and the API answers validation errors as `{field: message}` in Portuguese, which the forms show next to each field.
4. Invites and password resets email a single use link to `/nova-senha`. Locally, Mailpit catches the emails.

## Stack

| Layer | Tech |
|---|---|
| API | Python 3.12, FastAPI, Pydantic 2, SQLAlchemy 2 (typed ORM), Alembic, psycopg 3, argon2-cffi |
| Web | Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, TypeScript, Tailwind CSS 4, openapi-fetch and openapi-typescript |
| Data | Postgres 17 locally, any managed Postgres in production |
| Tooling | uv, Ruff, pytest, ESLint, Docker Compose, Mailpit |
| Hosting | Vercel: one project for the API (Python runtime) and one for the web app, plus Vercel Cron for the demo reset |

## Repository

```
api/app/                 FastAPI app: models, schemas, routers, security, seed
api/migrations/          Alembic migrations
api/tests/               pytest suite, including the permission matrix
api/scripts/             Vercel build step and the OpenAPI export
web/src/app/             Next.js routes (Portuguese URLs: /processos, /empresas, /advogados)
web/src/actions/         Server actions that call the API
web/src/lib/api/         Generated OpenAPI schema and types, typed client
docs/TDD.md              Technical design document
docker-compose.yml       Local Postgres and Mailpit
```

## Run locally

Requires Docker Desktop, Python 3.12 with [uv](https://docs.astral.sh/uv/), and Node.js 20 or later.

```bash
docker compose up -d                     # Postgres on 5433, Mailpit on 8025
```

```bash
cd api
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m app.cli seed-demo --yes # fictional companies, lawyers and cases
uv run uvicorn app.main:app --reload     # http://localhost:8000/docs
```

```bash
cd web
cp .env.example .env.local
npm install
npm run dev                              # http://localhost:3000
```

With `DEMO_MODE=true` the sign in page offers one click access as each role. Invite and reset emails show up in Mailpit at http://localhost:8025. To start a real office instead of the demo, set `DEMO_MODE=false` and create the first secretary, who then invites everyone else:

```bash
uv run python -m app.cli create-user --role secretary --name "Maria Souza" --email maria@example.com
```

After changing the API, regenerate the web app's types with `npm run gen:api`.

## Tests

```bash
cd api && uv run pytest && uv run ruff check . && uv run ruff format --check .
cd web && npm run lint && npm run typecheck && npm run build
```

The API suite runs against the `casedesk_test` database that Docker Compose creates. It applies the migrations down and up first, then covers authentication (hashing, lockout, session expiry and revocation, reset and invite links), the permission matrix for every role, scoping of lists and counts, validation messages, the CSV export, the demo guards and the Brazilian document validators, including the alphanumeric CNPJ.

## Deploy

Two Vercel projects from this repository:

| Project | Root directory | Environment |
|---|---|---|
| API | `api` | `DATABASE_URL` (pooled connection), `WEB_BASE_URL`, `DEMO_MODE`, `CRON_SECRET`, optional `SMTP_*` |
| Web | `web` | `API_URL` (the API project's URL), `DEMO_MODE` |

Production builds of the API run `alembic upgrade head` and, in demo mode, load the demo data into an empty database (`api/scripts/vercel_build.py`). Preview builds never migrate. Vercel Cron calls `GET /demo/reset` daily at 06:00 UTC with `CRON_SECRET` as a bearer token.

## Status

A working, tested application with a public demo, not a product with paying users. Before a real office relied on it, it would still need:

- **Email delivery.** A transactional provider with SPF and DKIM. Without SMTP settings the API only logs that an email was due.
- **Rate limiting at the edge.** Sign in locks an account after 5 failures, but there is no per IP limit.
- **Case history.** An audit trail of who changed what, deadlines, hearings and attachments.
- **Scale features.** Pagination and server side sorting for large lists, and the CNJ case number.
