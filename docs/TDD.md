# Case Desk: technical design

Status: implemented (v2.0, October 2026). This document explains how Case Desk is built and why, for anyone changing it.

## 1. Goals and non-goals

**Goals**

- One place for a law office to track its cases, the client companies they belong to and the lawyer responsible for each.
- Three roles with different reach (secretary, lawyer, client), enforced by the server on every request.
- Credentials handled to current practice: hashed passwords, revocable sessions, single use links, no secrets in the code.
- A public demo anyone can try without an account, that cannot be broken for the next visitor.

**Non-goals (for now)**

- Several offices in one deployment (multi-tenancy).
- Court integrations, deadlines, hearings, documents and billing.
- A native or desktop app (the 2022 version shipped an Electron shell; the web app is responsive instead).

## 2. Architecture

```
Browser ──> Next.js web app ──> FastAPI ──> Postgres
                │                  │
                │                  └──> SMTP (Mailpit locally)
                └── httpOnly cookie with the session token
```

- **The API owns every rule.** Authentication, authorization, validation and data integrity live in FastAPI and Postgres. The web app holds no business rules beyond showing or hiding what a role cannot use.
- **Backend for frontend.** Only the Next.js server talks to the API. The browser gets HTML from server components and submits forms to server actions, so the session token never reaches browser JavaScript and the API needs no CORS.
- **Interface.** MUI v9 with MUI X DataGrid Pro, themed in `web/src/theme.ts` with one theme per language (pt-BR and en-US locales for both). Pages are server components that fetch from the API and hand plain data to one client view per page; grid edits call server actions such as `patchCase`, which answer with the saved row or a message for the snackbar.
- **Typed contract.** `api/scripts/export_openapi.py` writes the OpenAPI schema into `web/src/lib/api/openapi.json`, and `openapi-typescript` turns it into `schema.d.ts`. The web app calls the API through `openapi-fetch`, so a renamed field breaks the web build instead of a page at runtime.

### Why FastAPI and Next.js instead of one framework

The 2022 project already split a Python API from a React front end. Keeping that split means the API is usable on its own (Swagger at `/docs`), Python owns the data and validation, and the web app can be replaced without touching the rules. The cost is two deployments and one extra network hop per page, acceptable at this size.

## 3. Data model

| Table | Purpose | Notes |
|---|---|---|
| `companies` | Client companies | `cnpj` unique, 14 characters, numeric or alphanumeric |
| `users` | Secretaries, lawyers and client users | `role` in (secretary, lawyer, client); a CHECK ties `company_id` to the client role; `password_hash` is null until the invite is accepted; `is_demo` marks the shared demo accounts |
| `cases` | Legal cases | `company_id` and `lawyer_id` with `ON DELETE RESTRICT`; `status` and `practice_area` with CHECK constraints |
| `sessions` | Active sessions | SHA-256 of the token, expiry; deleted on sign out, password change and deactivation |
| `password_tokens` | Invite and reset links | SHA-256 of the token, purpose, expiry, `used_at` |

Choices:

- **Integer keys, not documents.** The 2022 schema linked cases by CNPJ and CPF strings, so correcting a CNPJ broke its cases. Documents are now plain attributes.
- **Enums as VARCHAR with CHECK constraints.** Adding a status is an ordinary migration, with no Postgres enum type to alter.
- **Deletion rules.** A company with cases cannot be deleted (409); deleting a company removes its client users (`CASCADE`). Lawyers are never deleted: they are deactivated, and only once their open cases are transferred.
- **Documents stored normalized.** CNPJ and phone are stored without punctuation, OAB as `OAB/SP 123.456`. Check digits are validated, including the alphanumeric CNPJ of IN RFB 2.229/2024 (each character counts as its ASCII code minus 48).

Migrations live in `api/migrations` and are generated with Alembic autogenerate, then reviewed.

## 4. Authentication

- **Passwords:** Argon2id via `argon2-cffi` with its default parameters, rehashed on sign in when the parameters change. Minimum 8 characters.
- **Sign in:** `POST /auth/login` with email and password. Unknown emails verify against a dummy hash, so both failures take about the same time and return the same message. After 5 consecutive failures the account locks for 15 minutes (429).
- **Sessions:** a random 256 bit token (`secrets.token_urlsafe(32)`), stored only as its SHA-256. Valid for 12 hours. The web app keeps it in an httpOnly, `SameSite=Lax`, `Secure` (in production) cookie that expires with the session. Expired sessions are purged on each new sign in.
- **Revocation:** sign out deletes the session; changing the password ends every other session; a reset ends all of them; deactivating a user ends theirs, and inactive users fail every check.
- **Invites and resets** share one mechanism: a single use token, hashed in `password_tokens`, emailed as a link to `/nova-senha?token=...`. Invites last 72 hours, resets 30 minutes, and issuing a new link voids the previous one. `POST /auth/password-reset` answers the same for every email. Confirming sets the password and signs the person in. The page that receives the link sets a `no-referrer` policy, so the token never leaks to another site.
- **Bootstrap:** there is no public sign up. The first secretary comes from `python -m app.cli create-user`, which prints an invite link.

## 5. Authorization

Two FastAPI dependencies do the work:

- `require_roles(...)` guards each route by role (`Secretary`, `Staff` and `CurrentUser` aliases in `app/deps.py`).
- `_scope(user)` in `app/routers/cases.py` returns the filter for what a user may see: everything for the secretary, `lawyer_id = me` for a lawyer, `company_id = my company` for a client. Lists, counts, the CSV export, reads, updates and deletes all go through it.

Rules beyond the role table in the README:

- Out of scope records answer **404, not 403**, so ids cannot be probed.
- A lawyer who creates a case is always its lawyer; sending another `lawyer_id` is a 403. Only the secretary transfers cases.
- Clients never change cases, companies or other users; they can only edit their own profile and password.

`api/tests/test_permissions.py` holds the full matrix (role, method, path, expected status), so a new route without a check shows up as a failing row once it is added there.

## 6. Validation and errors

- Pydantic models in `app/schemas.py` validate and normalize input (trimmed names, lowercase emails, documents).
- A custom handler turns validation errors into `{"detail": "Confira os campos destacados.", "errors": {"field": "message"}}`, in the request language (section 7). Business rule conflicts on a field (a CNPJ already registered, an email in use) use the same shape with status 409 through `FieldError`.
- The web app's `ActionForm` puts `errors[field]` under each field and keeps what the user typed after a failed submit.

## 7. Languages

- **Detection** follows joaosantaniello.com: Portuguese when any `Accept-Language` entry is Portuguese, when `x-vercel-ip-country` is a Portuguese-speaking country (BR, PT, AO, MZ, CV, GW, ST, TL), for bots and link previews, and when nothing is known; English otherwise.
- **Storage:** unlike the site, which serves English under `/en/`, the app keeps one URL per page in English (`/cases`, `/companies`) and stores the language in the `cd-lang` cookie for a year. `proxy.ts` sets it on the first visit, on the request too, so the first page already renders in that language. The EN/PT switch rewrites the cookie and refreshes the page in place.
- **Web copy** lives in `web/src/content/*.ts` as `Record<Locale, ...>` objects. Server components read the language with `getLocale()`, client components with `useLocale()`. MUI and the DataGrid use their own pt-BR and en-US locales (one theme per language), and dates format with `Intl` in Brasília time.
- **API messages** live in `api/app/i18n.py`. A middleware reads `Accept-Language` into a context variable, so validators and routers call `t(key)`; the default is Portuguese, so clients that send nothing get the original messages. The CSV export and the invite and reset emails follow the same language.
- **Demo data** stays in Portuguese on purpose. The English sign in page and banner explain that the office is Brazilian and what CNPJ and OAB are.

## 8. Demo mode

Enabled with `DEMO_MODE=true` on both projects.

- `POST /auth/demo-login {role}` signs in as the shared demo account of that role. It returns 404 when demo mode is off.
- Demo accounts have no password, so the password form cannot reach them, and their profile, email, password and activation cannot be changed. A company with a demo user cannot be deleted.
- Creation is capped at 150 cases, 40 companies and 40 users in total, so the database cannot be filled between resets.
- `GET /demo/reset`, called daily by Vercel Cron with `CRON_SECRET` as a bearer token, truncates every table and loads `app/seed.py`.
- The seed is fictional: invented names, emails on the reserved `.example` domain, no phone numbers, and CNPJs with a `DEMO` root in the alphanumeric format, which cannot belong to a real company.
- The demo does not send email. Leave the SMTP settings empty there, otherwise a visitor could invite their own address and get a password based account.

## 9. Deployment

Two Vercel projects from the same repository, with root directories `api` and `web`.

- The API uses Vercel's zero configuration FastAPI support: `tool.vercel.entrypoint = "app.main:app"` in `pyproject.toml`, dependencies from `uv.lock`, Python from `.python-version`. Each instance opens connections with `NullPool`, since the database URL should point at the provider's connection pooler.
- `scripts/vercel_build.py` runs on every API build. In production it applies the migrations and, in demo mode, seeds an empty database. Preview builds skip both.
- `api/vercel.json` keeps tests and migrations out of the function bundle and declares the cron job.
- The web project needs `API_URL` and `DEMO_MODE`. It reads no secrets.

Vercel Services (one project with both runtimes on a shared domain) would remove the second project and the cross project hop, but it is in beta; it is the natural next step once generally available.

## 10. Testing

| Layer | What | How |
|---|---|---|
| Migrations | Down to base and up to head | Session fixture in `tests/conftest.py` |
| Auth | Hashing, lockout, timing safe misses, expiry, revocation, reset and invite links, single use | `tests/test_auth.py` |
| Authorization | Every role against every route, list scoping, client lawyer list | `tests/test_permissions.py` |
| Rules | Case creation and transfer, counts, search, CSV, company and lawyer rules | `tests/test_cases.py`, `tests/test_companies_and_lawyers.py` |
| Demo | Off by default, account protection, caps, cron secret | `tests/test_demo.py` |
| Validators | CNPJ (numeric and alphanumeric), phone, OAB | `tests/test_validators.py` |
| Languages | Accept-Language parsing, every message in both languages, English validation, business errors and CSV | `tests/test_i18n.py` |
| Web | Types, lint, production build | `npm run typecheck`, `npm run lint`, `npm run build` |
| Bulk delete | `DELETE /cases?ids=...` for the secretary, skipping unknown ids | `tests/test_cases.py`, permission matrix |

Tests run against Postgres, not SQLite, because the constraints, `ILIKE` and `TRUNCATE ... CASCADE` are part of the behaviour under test.

## 11. Risks and trade-offs

- **Two hops per page.** Web server to API to database. Fine for this size; Services or a shared region keeps it low.
- **Per account lockout only.** Someone can lock a known email for 15 minutes. A per IP limit at the edge (Vercel Firewall) is the fix.
- **No audit trail.** Changes overwrite the previous values. A `case_events` table is the next feature for a real office.
- **Lists are not paginated.** Fine for one office; needs pagination past a few thousand cases.
