# CLAUDE.md

This file gives Claude Code (and any other agent) the context needed to
work in this repository without re-deriving it from scratch every time.

## What this is

A gym/workout tracking app ("Gorilla"): log workouts, sets (reps/weight),
manage a personal + global exercise library, and build reusable training
plans that pre-fill a workout when started. FastAPI + PostgreSQL backend,
React + Vite frontend.

## Running the whole project locally

### Prerequisites

- PostgreSQL running locally. If not installed: `brew install postgresql@16 && brew services start postgresql@16`.
- A `gym_tracker` database and `gym_user` role matching `backend/app/.env`'s `DATABASE_URL`. If they don't exist:
  ```bash
  psql postgres -c "CREATE ROLE gym_user WITH LOGIN PASSWORD '<matches .env>';"
  psql postgres -c "CREATE DATABASE gym_tracker OWNER gym_user;"
  ```

### Backend

```bash
cd backend/app
venv/bin/python3 -m alembic upgrade head        # apply migrations
venv/bin/python3 -m scripts.seed_exercises      # seed global exercise library (idempotent)
venv/bin/python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Always invoke tools via `venv/bin/python3 -m <tool>`, never `venv/bin/pip` or `venv/bin/pytest` directly** — see Gotchas below.

Copy `backend/app/.env.example` to `backend/app/.env` and fill in real values if it doesn't already exist.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # if .env doesn't already exist; default already points at localhost:8000
npm run dev
```

Open `http://localhost:5173`. The backend must be running at the URL in `VITE_API_BASE_URL` (default `http://localhost:8000`).

## Architecture

### Backend (`backend/app/`)

```
main.py            - FastAPI app creation, router registration, CORS
core/
  config.py         - Settings (env-driven)
  security.py        - password hashing, JWT create/decode
  database.py          - engine/session/Base
api/
  deps.py               - get_current_user, get_db dependency wiring
  routers/
    auth.py, exercises.py, workouts.py, plans.py
models.py                - all SQLAlchemy models (User, Exercise, Workout, SetEntry, WorkoutPlan, PlanExercise) — deliberately flat, not split per entity
schemas.py                 - all Pydantic schemas — same reasoning
scripts/seed_exercises.py     - one-time global exercise seed
tests/                          - schema-level + auth-helper unit tests only (see Gotchas)
alembic/                          - migrations
```

### Frontend (`frontend/src/`)

```
app/            - routing, providers, thin route pages (app/routes/*)
components/
  ui/            - shared primitives: Button, TextField, Select, ErrorBanner, EmptyState, Skeleton
  layout/         - ProtectedLayout, PublicLayout
features/
  workouts/, exercises/, plans/
    api/           - one file per operation, each exports a fetcher + its useQuery/useMutation hook
    components/      - feature-specific UI, composed by app/routes/*
    index.js           - the ONLY thing other code should import from this feature
  auth/            - shaped differently: just components/ (LoginForm, RegisterForm) + index.js.
                       Its hooks (useUser/useLogin/useRegister/useLogout) live in lib/auth.jsx
                       instead of features/auth/api/, since they're cross-cutting — used by
                       router guards (ProtectedLayout/PublicLayout) outside the auth feature itself.
lib/
  api-client.js         - fetch wrapper + token handling
  auth.jsx                - useUser/useLogin/useRegister/useLogout (TanStack Query, no Context)
  react-query.js            - QueryClient instance
hooks/useExitTransition.js  - shared collapse-on-delete hook, used by every list
config/env.js                 - reads import.meta.env
styles/globals.css               - Tailwind import + @theme design tokens + @keyframes
```

**Import boundary convention** (not tool-enforced — oxlint doesn't have this configured; it's discipline, not a lint rule): features are only imported through their `index.js` barrel, from `app/routes/*` or from other features. Never reach into `features/<x>/components/Foo.jsx` directly from outside that feature.

**Data fetching**: TanStack Query throughout. Query keys: `['workouts']` / `['workouts', id]`, `['exercises']`, `['plans']` / `['plans', id]`, `['auth', 'me']`. Mutations invalidate or directly patch the relevant key on success — check the relevant `features/<x>/api/*.js` file before assuming a mutation needs a manual refetch.

## Findings / gotchas

- **`backend/app/venv` was committed to git before this restructure, with another developer's absolute path baked into its scripts** — `.gitignore` now excludes `venv/` going forward (added during the git-hygiene cleanup), so a fresh `git clone` won't have this problem at all. But if you're working in a checkout that predates that cleanup, or one that inherited this specific `venv/` directory, its `pip` script is confirmed broken ("bad interpreter"). Whether `venv/bin/pytest` or other scripts happen to still work is unreliable — it depends on how closely your machine's path matches the one baked in, which is pure coincidence, not something to rely on. Always invoke via `venv/bin/python3 -m <tool>` regardless of whether the un-prefixed script currently seems to work. If this ever causes friction, just regenerate it fresh: `rm -rf venv && python3 -m venv venv && venv/bin/python3 -m pip install -r requirements.txt -r requirements-dev.txt`.
- **`SECRET_KEY` was rotated** (it was previously committed to git in plaintext, along with both `.env` files, before a `.gitignore` was added). The *old* key still exists in git history — it was never scrubbed, since rewriting history is disruptive and wasn't warranted here. Rotating made the old key harmless (any JWTs it signed are rejected under the new key); it just means don't assume history is clean if you ever `git log -p` near the pre-cleanup commits.
- **CORS is still `allow_origins=["*"]` combined with `allow_credentials=True`** (`backend/app/main.py`) — a combination browsers technically reject, and moot here anyway since auth uses Bearer tokens, not cookies. Identified during the original review, never fixed — low priority since it's harmless as configured, but tighten it before this ever serves a non-Bearer-token client.
- **Backend test coverage is real but narrow**: `tests/test_auth.py`, `tests/test_schemas.py` (including the Plan schemas), and `tests/test_seed_exercises.py` are genuine unit tests. There is **no integration test suite** (`TestClient` + test DB) against any router — `auth`, `exercises`, `workouts`, and `plans` are all only verified manually via `curl`. If you're adding a new endpoint, there's no existing pattern to copy for testing it end-to-end; you'd be establishing one.
- **Frontend has zero automated tests** — no Vitest, no React Testing Library. This was an explicit scope decision (see `docs/superpowers/specs/2026-07-27-app-restructure-design.md`), not an oversight. Verification is manual browser click-through.
- **CI (`.github/workflows/CI.yaml`) only runs backend `pytest`** — there's no frontend lint/build/test step in CI at all. `npm run lint` (oxlint) and `npm run build` both exist as scripts but nothing invokes them automatically.
- **Branding is "Gorilla"** — settled 2026-07-27. The UI header, `index.html` title, PWA manifest, and frontend `README.md` all say Gorilla; anything still reading "Żelazo" is stale. Two internal identifiers were deliberately left alone: `package.json`'s `name` (`gym-tracker-react`, never user-visible) and the localStorage key `zelazo_token` in `lib/api-client.js` (renaming it silently logs out every existing session — only rename it alongside a migration or a deliberate forced logout).
- **`workouts.py`'s `add_set` validates that a submitted `exercise_id` exists, but not that it's visible to the current user** (global or owned by them) — a user could reference another user's private exercise by guessing its id, and the response would reflect that exercise's name back to them. Found during the final whole-branch review while fixing the same-shaped (and now-fixed) gap in `plans.py`'s `create_plan`. Deliberately not fixed here — it's a pre-existing pattern predating this restructure, out of scope for this round, and the blast radius is limited to exercise names (not workouts or credentials). Worth closing with a shared visibility-check helper next time `workouts.py` is touched.
- **The `/plans/{id}` delete behavior is load-bearing**: deleting a `WorkoutPlan` must leave existing `Workout` rows created from it intact, with `plan_id` set to `NULL` (`ondelete="SET NULL"` on the FK) — not cascade-deleted, not blocked by a FK violation. This is directly promised by the frontend's own delete-confirmation copy. If you ever touch `models.Workout.plan_id` or its migration, re-verify this specific behavior (create plan → start workout from it → delete plan → confirm the workout still loads with `plan_id: null`).
- **`Button`'s `pulseOnClick` confirmation-pulse doesn't actually turn the button green**, though the code intends it to (`frontend/src/components/ui/Button.jsx`). Confirmed via measured `getComputedStyle` in a real browser during Task 8 testing: the button's background stays the base variant color (e.g. red/orange for primary buttons) both during and after the "pulse" window. Root cause: the pulse color's Tailwind class (`bg-[#4b7a4b]`) is appended to the className string after the variant's base color class, but Tailwind's generated CSS declaration order isn't determined by className string order — so the base color class wins the cascade regardless of where it sits in the DOM string. The small circular checkmark badge (a separate element with no competing base class) does correctly flash green, so there's partial visual feedback, just not the intended "whole button turns green" effect. Not fixed — cosmetic only, worth a follow-up (e.g. an `!important`-equivalent Tailwind modifier, or restructuring to a single dynamic class lookup instead of concatenation).
