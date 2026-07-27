# Gym app restructure & UI refresh — design

Date: 2026-07-27
Status: approved, ready for implementation planning

## Context

The app is a solo-developer gym/workout tracker: a FastAPI + PostgreSQL backend
and a React + Vite frontend (`Frontend_new`), with a superseded vanilla-JS
frontend (`Frontend`) still sitting in the repo. This document captures a
full review of the current state and the design for a combined
repo-restructure + backend feature-completion + frontend architecture
rebuild + UI refresh.

## Review findings (the "why")

- **`Frontend_new` folder casing/naming** doesn't match the intended final
  name and the legacy `Frontend` folder is dead weight — both explicitly
  called out by the project owner.
- **The "Plans" feature is broken end-to-end.** `Frontend_new/src/pages/Plans.jsx`
  and `WorkoutDetail.jsx` call `/plans/*` endpoints that don't exist in the
  backend at all — no router, no model, no migration. The frontend's own
  README documents this as a known gap.
- **Secrets are committed to git.** `Backend/app/.env` (contains `SECRET_KEY`)
  and `Frontend_new/.env` are both tracked. There is no `.gitignore`
  anywhere in the repo, so `venv/`, `node_modules/`, and `__pycache__/` are
  also committed — 14,246 of the 14,299 tracked files are things that
  shouldn't be in git.
- **The committed `venv` is machine-specific** — it has another developer's
  absolute path baked into its shebangs, which is why `pip` itself was
  broken when the app was first run in this environment.
- **CORS is `allow_origins=["*"]` combined with `allow_credentials=True`** —
  a combination browsers reject, and meaningless here anyway since auth
  uses Bearer tokens, not cookies.
- **CI only runs backend `pytest`** (`.github/workflows/CI.yaml`) — no
  frontend lint/build/test step, and it hardcodes `working-directory:
  Backend/app`, which breaks the moment the backend folder is renamed.
- **Backend test coverage is thin**: only `auth.py` helpers and Pydantic
  schema validation are tested. Zero integration tests exist against the
  actual routers (`workouts`, `exercises`, and the not-yet-built `plans`).
- **Frontend has zero tests**, no TypeScript, and every page hand-rolls the
  same fetch/loading/error boilerplate in a `useEffect`/`useState` pair —
  no shared data-fetching hook or library.
- **Styling** is one global CSS file plus heavy inline `style={{}}` in JSX.
  The palette itself (dark, warm, "iron/steel" themed — see below) is a
  deliberate, distinctive design, not generic — worth preserving, not
  replacing.
- `alert()`/`confirm()` are used throughout for error display and
  destructive-action confirmation.

## Decisions made during brainstorming

1. **Plans feature**: implement it fully on the backend (models, migration,
   router) rather than leaving it broken or stripping it from the frontend.
2. **Git hygiene**: full cleanup — add `.gitignore`, untrack the committed
   junk/secrets, and rotate `SECRET_KEY`. The old key remains readable in
   git history (no history rewrite planned — that's a destructive,
   disruptive operation not justified here); rotating it makes the exposed
   value moot for anything going forward.
3. **Backend internal structure**: reorganize it (not just rename the
   top-level folder) into a conventional FastAPI layout, applying the same
   care as the frontend restructure.
4. **Frontend testing**: out of scope for this round. No Vitest/RTL setup.
   Verification is manual: run the dev server and click through each flow
   in the browser after each feature migration.
5. **Styling method**: Tailwind CSS v4, with the existing color/font tokens
   mapped into Tailwind's theme (CSS-first `@theme`) so utility classes
   resolve to the app's exact existing values — not Tailwind's defaults.
   (Originally CSS Modules were discussed and approved; Tailwind supersedes
   that decision per direct request after seeing a mockup comparison.)
6. **Data fetching**: introduce TanStack Query (`@tanstack/react-query`) as
   a real dependency, rebuilding data fetching around
   `useQuery`/`useMutation` per feature, replacing the current
   `AuthContext` (React Context) entirely — with TanStack Query as the
   shared cache, `useUser()` can be called anywhere without a Provider.
7. **Execution strategy**: phased/incremental (see below), not big-bang and
   not parallel subagents — the frontend Plans work depends on the backend
   Plans API existing, so the two workstreams aren't actually independent.

## Repo-level changes

```
Backend/       → backend/
Frontend/      → deleted (git rm -r; fully superseded by Frontend_new,
                 recoverable from git history if ever needed)
Frontend_new/  → frontend/
```

**Git hygiene:**
- Root `.gitignore`: `venv/`, `node_modules/`, `__pycache__/`, `*.pyc`,
  `.env`, `dist/`, `.DS_Store`, `.superpowers/` (the visual-brainstorming
  companion's working directory used during this design phase)
- `git rm --cached` the currently-tracked junk and both `.env` files (stays
  on disk, just leaves the git index)
- Add `backend/app/.env.example` and `frontend/.env.example` documenting
  required vars with placeholder values
- Rotate `SECRET_KEY` in the backend `.env` — this invalidates any JWTs
  already issued (any locally-logged-in session, e.g. from earlier smoke
  testing), requiring a fresh login; no data loss

## Backend design

### Internal restructure

```
backend/app/
  main.py                 # app creation, router registration, CORS — thin
  core/
    config.py              # Settings (env-driven config)
    security.py             # password hashing + JWT create/decode
    database.py              # engine/session/Base only
  api/
    deps.py                  # get_current_user + get_db dependencies
    routers/
      auth.py
      exercises.py
      workouts.py
      plans.py                # NEW
  models.py                    # kept flat — 5 small models don't earn a package
  schemas.py                    # kept flat, same reasoning
  scripts/
    seed_exercises.py           # moved from root
  tests/
    test_auth.py
    test_schemas.py
    test_seed_exercises.py      # typo fixed (was test_seed_excercises.py)
  alembic/                       # unchanged
```

`models.py` and `schemas.py` deliberately stay flat — at ~80 lines each with
4-5 small classes, splitting by entity would add indirection without real
benefit. Splitting by concern (`core/`, `api/`) earns its keep; splitting by
entity doesn't, yet.

### Plans feature

New models:
```python
class WorkoutPlan(Base):
    __tablename__ = "workout_plans"
    id, owner_id (FK users), name, created_at
    plan_exercises = relationship(cascade="all, delete-orphan", order_by="PlanExercise.order_index")

class PlanExercise(Base):
    __tablename__ = "plan_exercises"
    id, plan_id (FK workout_plans), exercise_id (FK exercises),
    order_index, target_sets (nullable), target_reps (nullable)
```
`Workout` gains `plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=True)`.

New schemas: `PlanExerciseCreate`, `PlanExerciseOut` (with `exercise_name`
populated the same way `SetOut.exercise_name` is today), `WorkoutPlanCreate`
(`name` + `list[PlanExerciseCreate]`), `WorkoutPlanOut`. `WorkoutOut` gains
`plan_id`. `WorkoutCreate` does **not** — the frontend never sends `plan_id`
on regular workout creation (`POST /workouts/` is always called with an
empty body); it's only ever set server-side, by `POST /plans/{id}/start`.

New router `api/routers/plans.py`, contract pinned to what the frontend
already sends/expects (verified against the actual `Plans.jsx` and
`WorkoutDetail.jsx` request payloads):
- `GET /plans/` — list current user's plans
- `POST /plans/` — create a plan with its plan_exercises in one call
- `GET /plans/{id}` — fetch one (used by `WorkoutDetail` when
  `workout.plan_id` is set)
- `DELETE /plans/{id}` — ownership-checked delete
- `POST /plans/{id}/start` — creates a new `Workout` with
  `plan_id=plan.id`, `workout_date=today`, returns `WorkoutOut`

New Alembic migration for the two tables + the `Workout.plan_id` column.

Schema-level tests added for the new Pydantic models, matching the existing
`test_schemas.py` style (validation only, no DB). Full `TestClient`
integration testing is explicitly **not** being added here — that gap exists
for `workouts`/`exercises` too and isn't part of this round; it's recorded
as a known gap in CLAUDE.md rather than silently expanded into scope.

### CI fix

`.github/workflows/CI.yaml` hardcodes `working-directory: Backend/app`.
Updating it to `backend/app` is a required mechanical fix in the same phase
as the folder rename, not optional extra scope — without it, CI breaks the
moment the rename lands.

## Frontend design

### Folder structure (bulletproof-react, adapted)

```
frontend/src/
  app/
    app.jsx              # root: <AppProvider><Router/></AppProvider>
    provider.jsx          # QueryClientProvider wrapper
    router.jsx             # route table
    routes/                # thin pages that compose feature components
      login.jsx
      register.jsx
      workouts.jsx
      workout-detail.jsx
      exercises.jsx
      plans.jsx
  components/
    ui/                   # Button, TextField, ErrorBanner, EmptyState, Skeleton
    layout/                # ProtectedLayout, PublicLayout
  features/
    auth/
      components/          # LoginForm, RegisterForm
      index.js
    workouts/
      api/                  # get-workouts.js, create-workout.js, add-set.js, ...
                             # (fetcher + matching useX query/mutation hook per file)
      components/            # WorkoutList, WorkoutCard, SetRow, BarbellVisual, AddSetForm
      index.js
    exercises/               # same shape: api/, components/, index.js
    plans/                    # same shape: api/, components/, index.js
  lib/
    api-client.js            # fetch wrapper + token handling (from lib/api.js)
    auth.jsx                  # useUser/useLogin/useRegister/useLogout
    react-query.js             # QueryClient instance
  config/
    env.js                     # reads/validates import.meta.env
  styles/
    globals.css                 # Tailwind import + @theme tokens + @keyframes
  assets/
  main.jsx
```

**`AuthContext` is removed.** With TanStack Query as the shared cache,
`useUser()` (a query on `/auth/me`) can be called directly wherever `user`
is needed — the query cache dedupes it automatically. `lib/auth.jsx` becomes
a set of hooks (`useUser`, `useLogin`, `useRegister`, `useLogout`) instead
of a Context/Provider pair.

**Data fetching**: each `features/<x>/api/` file pairs a plain fetcher with
its query/mutation hook (e.g. `get-workouts.js` exports both
`getWorkouts()` and `useWorkouts()`). Mutations invalidate the relevant
query keys on success (e.g. adding a set invalidates that workout's query).
This removes the duplicated fetch boilerplate from every page — the core
frontend pain point identified in the review.

**Import boundary convention**: features are only imported through their
`index.js` barrel — nothing reaches into another feature's internals. This
is a documented convention (in CLAUDE.md), not tool-enforced — enforcing it
would need an ESLint import-boundary rule, and the project uses `oxlint`,
whose support for that hasn't been checked. Don't claim it's enforced when
it isn't.

**Example mapping** (`Workouts.jsx` today → after): `app/routes/workouts.jsx`
becomes a thin page calling `useWorkouts()` and rendering `<WorkoutList>`;
`features/workouts/components/WorkoutList.jsx` and `WorkoutCard.jsx` hold
the actual markup; `features/workouts/api/` holds `get-workouts.js`,
`create-workout.js`, `delete-workout.js`. Every other page follows the same
page-vs-feature split.

**Small in-scope behavior change**: `alert()` for mutation/API errors is
replaced by rendering the mutation's `error` through the existing
`.error-banner` visual pattern. `confirm()` stays for destructive-action
confirmations (delete workout/plan/exercise) — building a custom confirm
modal is a UX feature addition, not part of this refactor.

### Styling & UI system

Tailwind CSS v4, CSS-first config, one file
(`frontend/src/styles/globals.css`):

```css
@import "tailwindcss";
@theme {
  --color-bg: #2B2925;
  --color-surface: #3A362F;
  --color-surface-raised: #443F37;
  --color-line: #4E483F;
  --color-text: #F0EDE4;
  --color-text-muted: #B5AC9C;      /* contrast fix, was #A39C8C */
  --color-accent: #C24A36;           /* unchanged */
  --color-accent-hover: #C64F3A;     /* contrast fix, was #D3573F */
  --color-accent-gold: #D9A441;
  --color-accent-text: #EA8E70;      /* new token, red text/icons on dark bg */
  --font-display: 'Oswald', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
@keyframes rise { /* card entrance */ }
@keyframes shimmer { /* skeleton loading */ }
@keyframes shake { /* invalid input */ }
```

This makes `bg-surface`, `text-text-muted`, `font-display`, etc. resolve to
the app's exact existing values. Nothing about the palette changes except
the three contrast fixes below. The bespoke barbell/plate visual (dynamic,
weight-driven widths) stays as small custom CSS + the existing runtime
inline style for the computed width — Tailwind utilities don't fit
runtime-computed values, same as today.

**Contrast fixes** (WCAG AA, measured; everything else in the palette
already passes comfortably and is untouched):

| Usage | Before | Ratio | After | Ratio |
|---|---|---|---|---|
| Muted text on card surfaces | `#A39C8C` | 4.40:1 (fail) | `#B5AC9C` | 5.34:1 (pass) |
| Primary button, hover, white label | bg `#D3573F` | 4.03:1 (fail) | bg `#C64F3A` | 4.58:1 (pass) |
| Delete icon, hover, on dark surface | `#C24A36` | 2.47:1 (fail) | new `--accent-text: #EA8E70` | 4.92:1 (pass) |

`--accent` itself (`#C24A36`) is unchanged — it already passes everywhere
it's actually used, as a filled button/plate background with white text.

**`components/ui/`** primitives (Button, TextField, ErrorBanner, EmptyState,
Skeleton) are plain `.jsx` files using Tailwind classNames directly — no
paired stylesheet. Every feature composes these instead of repeating raw
`<input>`/`<button>` markup, which also removes the "field markup
copy-pasted across every form" duplication identified in the review.

**Animations** (all 120–200ms, chosen with an explicit constraint: this app
gets used mid-set, between reps, at a gym — nothing here may block or slow
down the next action):

| Animation | Where it lives |
|---|---|
| Set-logged confirmation pulse | `ui/Button.jsx` primary variant |
| Collapse-on-delete | Needs a small `useExitTransition`-style hook (delay actual list removal until the collapse transition finishes) — real logic, not just CSS |
| Skeleton loading | `ui/Skeleton.jsx`, replaces every "Wczytywanie…" loading string |
| Shake on invalid input | `ui/TextField.jsx` gets an `invalid` state; pairs with the `alert()` removal for validation errors specifically |
| Entrance stagger + hover-lift | Applied to list components (WorkoutList, ExerciseList, PlanList) via an `animate-rise` utility + per-index `animation-delay` (inline, since it's index-computed — same category of exception as the plate-width style) |

## Execution phases

**Phase 0 — Git hygiene** (no code changes): `.gitignore`, untrack junk +
secrets, `.env.example` files, rotate `SECRET_KEY`.

**Phase 1 — Backend**: rename folder, internal reorg, implement Plans
(models/schemas/router/migration/tests), fix CI's hardcoded path. Verify by
running the server and exercising `/plans/*` via curl, the same way the
existing endpoints were smoke-tested when the app was first run locally.

**Phase 2 — Frontend**: rename folder, delete legacy `Frontend/`, move/
rewrite `README.md` (dropping the now-obsolete "backend changes required
for Plans" section), add TanStack Query + Tailwind, build the new folder
skeleton, migrate feature-by-feature in dependency order — **auth →
workouts/exercises → plans** (plans depends on Phase 1). Apply the contrast
fixes and the five animations as part of each feature's migration, not as a
separate pass. Verify by running the dev server and clicking through each
flow in the browser after each feature lands.

**Phase 3 — CLAUDE.md**: written last, so it reflects the true end state
rather than the plan.

## CLAUDE.md content plan

A single root-level file covering:
- How to run the whole project locally (backend + PostgreSQL setup +
  frontend), matching what was manually verified when the app was first run
  in this environment
- Architecture overview for both sides (backend layout, frontend
  bulletproof-react layout, the feature import-boundary convention)
- Findings/gotchas: the committed-venv portability trap, the secret
  rotation (and that the old key still lives in git history, not scrubbed),
  the CORS wildcard+credentials mismatch, that only `auth.py`/schemas (and
  now the new Plan schemas) have real test coverage — `workouts`/
  `exercises`/`plans` routers have no integration tests, CI not covering
  the frontend at all, and the "Żelazo" vs "Gorilla" branding inconsistency
  between the UI copy and the README/package name

## Explicitly out of scope

- Frontend automated tests (Vitest/RTL) — deferred, manual browser
  verification only for this round
- Full backend integration test suite (`TestClient` + test DB) for
  `workouts`/`exercises`/`plans` — recorded as a known gap, not built now
- Rewriting git history to scrub the old `SECRET_KEY` — rotation is
  sufficient; history rewrite is disruptive and wasn't asked for
- Capacitor/iOS packaging — mentioned in the existing frontend README as
  aspirational, untouched by this design
- Reconciling the "Żelazo"/"Gorilla" branding inconsistency — noted as a
  finding, not fixed
- A custom confirm-dialog component to replace native `confirm()` for
  destructive actions
