# Backend Restructure & Plans Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up git hygiene (untrack secrets/junk, rotate the exposed secret key), rename `Backend/` to `backend/` with a conventional internal FastAPI layout, and implement the missing `/plans/*` API that the frontend already expects but the backend has never had.

**Architecture:** Reorganize the current flat `backend/app/` file bag into `core/` (config, security, db plumbing), `api/` (routers + auth dependency), `scripts/`, and `tests/` packages — a mechanical restructure verified by keeping the existing test suite green throughout. Then add the Plans feature (`WorkoutPlan`, `PlanExercise` models, a migration, Pydantic schemas, and a router) on top of the restructured code, matching the exact request/response contract the frontend (`Frontend_new/src/pages/Plans.jsx`, `WorkoutDetail.jsx`) already sends.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 (pydantic-settings), python-jose, passlib[bcrypt], pytest. PostgreSQL running locally via `postgresql@16` (Homebrew service), database `gym_tracker`, role `gym_user`.

## Global Constraints

- Python 3.12 only (matches the committed `venv` and CI's `setup-python` config) — do not upgrade the interpreter.
- No new pip dependencies. Everything needed (`fastapi==0.115.6`, `sqlalchemy==2.0.36`, `alembic==1.14.0`, `pydantic==2.10.4`, `pydantic-settings==2.7.1`, `python-jose[cryptography]==3.3.0`, `passlib[bcrypt]==1.7.4`, `bcrypt==4.0.1`, `pytest==8.3.4`) is already in `requirements.txt`/`requirements-dev.txt`.
- The committed `venv` at `backend/app/venv` has a broken `pip` shebang (baked-in path from a different machine). Always invoke tools as `venv/bin/python3 -m <tool>` (e.g. `venv/bin/python3 -m pytest`, `venv/bin/python3 -m uvicorn`, `venv/bin/python3 -m alembic`) — never call `venv/bin/pip` or `venv/bin/pytest` directly.
- `models.py` and `schemas.py` stay flat (no per-entity file split) — an explicit YAGNI decision; do not split them further.
- No new automated integration tests against live routers (no `TestClient` + test-DB setup). Only schema-level Pydantic validation tests, matching the existing `test_schemas.py` style. Router correctness is verified manually via `curl` in this plan.
- All user-facing error strings and docstrings are in Polish, matching the existing codebase — preserve this convention in any new code.
- Never print, log, or echo the contents of `.env` or the actual `SECRET_KEY`/`DATABASE_URL` values in any command output.
- The local PostgreSQL database (`gym_tracker`) already has seeded data (18 global exercises, at least one test user) from prior manual setup — do not drop or recreate it.

---

## Task 1: Git hygiene — gitignore, untrack secrets/junk, rotate SECRET_KEY

**Files:**
- Create: `.gitignore` (repo root)
- Create: `Backend/app/.env.example`
- Create: `Frontend_new/.env.example`
- Modify: `Backend/app/.env` (rotate `SECRET_KEY` value only)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a clean git index (venv/node_modules/__pycache__/.env untracked) that Task 2's folder rename operates on. No code interfaces.

- [ ] **Step 1: Create the root `.gitignore`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/.gitignore`:

```gitignore
# Python
__pycache__/
*.py[cod]
venv/
.venv/

# Node
node_modules/
dist/

# Environment
.env

# OS
.DS_Store

# Superpowers brainstorming companion (used during design phase)
.superpowers/
```

- [ ] **Step 2: Untrack the committed junk and secrets**

Run from the repo root:

```bash
git rm -r --cached Backend/app/venv
git rm -r --cached Frontend_new/node_modules
git ls-files -z -- '*__pycache__*' | xargs -0 git rm --cached
git rm --cached Backend/app/.env
git rm --cached Frontend_new/.env
```

Expected: each command prints a list of removed (`rm '...'`) index entries, no errors. These files remain on disk — only the git index changes.

- [ ] **Step 3: Verify they're now ignored, not just untracked**

```bash
git status --short -- Backend/app/venv Backend/app/__pycache__ Frontend_new/node_modules Backend/app/.env Frontend_new/.env
```

Expected: no output at all (the `.gitignore` now hides them entirely, rather than listing them as untracked `??` entries).

- [ ] **Step 4: Add `.env.example` files**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/Backend/app/.env.example`:

```
DATABASE_URL=postgresql://gym_user:your_password@localhost:5432/gym_tracker
SECRET_KEY=replace-with-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALGORITHM=HS256
```

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/Frontend_new/.env.example`:

```
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 5: Rotate `SECRET_KEY` without ever printing it**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/Backend/app
python3 -c "import secrets; print(secrets.token_hex(32))" > /tmp/new_secret.txt
sed -i '' "s/^SECRET_KEY=.*/SECRET_KEY=$(cat /tmp/new_secret.txt)/" .env
rm /tmp/new_secret.txt
grep -c '^SECRET_KEY=' .env
```

Expected final output: `1` (confirms the line still exists and was rewritten — the actual value is never printed to the terminal). This invalidates any JWTs issued before this point (e.g. from earlier manual testing) — a fresh `/auth/login` call will be needed to get a new valid token, no data is lost.

- [ ] **Step 6: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add .gitignore Backend/app/.env.example Frontend_new/.env.example
git commit -m "chore: add .gitignore, untrack secrets/venv/node_modules, rotate SECRET_KEY"
```

Note: `Backend/app/.env` itself is not staged (it's now gitignored) — only the new `.gitignore` and the two `.env.example` files are committed.

---

## Task 2: Rename `Backend/` to `backend/`, extract `core/`+`api/` packages, fix CI path

This is a mechanical restructure with no behavior change. Correctness is verified by keeping the full existing test suite green and confirming the server still boots — not by writing new tests for moved code.

**Files:**
- Rename: `Backend/` → `backend/` (git mv, two-step to survive case-insensitive filesystems)
- Create: `backend/app/core/__init__.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/core/security.py`
- Create: `backend/app/api/__init__.py`, `backend/app/api/deps.py`, `backend/app/api/routers/__init__.py`, `backend/app/api/routers/auth.py`, `backend/app/api/routers/exercises.py`, `backend/app/api/routers/workouts.py`
- Delete: `backend/app/database.py`, `backend/app/auth.py`, `backend/app/routers/` (whole directory)
- Modify: `backend/app/main.py`, `backend/app/models.py`, `backend/app/seed_exercises.py`, `backend/app/test_auth.py`
- Modify: `.github/workflows/CI.yaml`

**Interfaces:**
- Consumes: nothing new from Task 1 (independent file paths).
- Produces (for later tasks to depend on):
  - `core.config.settings` — the `Settings` instance (was `database.settings`)
  - `core.database.get_db`, `core.database.Base`, `core.database.SessionLocal`, `core.database.engine` (was `database.*`)
  - `core.security.hash_password(password: str) -> str`, `core.security.verify_password(plain_password: str, hashed_password: str) -> bool`, `core.security.create_access_token(data: dict) -> str` (was `auth.*`)
  - `api.deps.get_current_user(token, db) -> models.User` FastAPI dependency, `api.deps.oauth2_scheme` (was `auth.get_current_user`)
  - `api.routers.auth.router`, `api.routers.exercises.router`, `api.routers.workouts.router` (unchanged prefixes/paths, just new import location)

- [ ] **Step 1: Rename the folder (two-step, for case-insensitive filesystems)**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git mv Backend Backend_tmp
git mv Backend_tmp backend
```

(Two steps because on macOS's default case-insensitive filesystem, `git mv Backend backend` in one step can silently no-op since the OS sees both names as the same path.)

- [ ] **Step 2: Create `core/config.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/core/__init__.py` (empty file).

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 dni

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 3: Create `core/database.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/core/database.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency do wstrzykiwania sesji bazy danych w endpointach."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Create `core/security.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/core/security.py`:

```python
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:    #zahashowane hasło
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:     #sprawdzenie czy hasło jest poprawne, porównanie hasła z zahashowanym hasłem
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:    #utworzenie tokena dostępowego
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
```

- [ ] **Step 5: Create `api/deps.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/__init__.py` (empty file).

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/deps.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nie udało się zweryfikować danych logowania",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user
```

- [ ] **Step 6: Create `api/routers/auth.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/routers/__init__.py` (empty file).

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/routers/auth.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models, schemas
from core import security
from core.database import get_db
from api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Autentykacja"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Użytkownik z tym adresem email już istnieje")

    user = models.User(
        email=user_in.email,
        hashed_password=security.hash_password(user_in.password),
        display_name=user_in.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # form_data.username traktujemy jako email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy email lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
```

- [ ] **Step 7: Create `api/routers/exercises.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/routers/exercises.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models, schemas
from core.database import get_db
from api.deps import get_current_user

router = APIRouter(prefix="/exercises", tags=["Ćwiczenia"])


@router.get("/", response_model=list[schemas.ExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Zwraca ćwiczenia globalne + własne ćwiczenia użytkownika."""
    return (
        db.query(models.Exercise)
        .filter(or_(models.Exercise.is_global == True, models.Exercise.owner_id == current_user.id))
        .order_by(models.Exercise.name)
        .all()
    )


@router.post("/", response_model=schemas.ExerciseOut, status_code=201)
def create_exercise(
    exercise_in: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    exercise = models.Exercise(
        name=exercise_in.name,
        muscle_group=exercise_in.muscle_group,
        owner_id=current_user.id,
        is_global=False,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    exercise = (
        db.query(models.Exercise)
        .filter(models.Exercise.id == exercise_id, models.Exercise.owner_id == current_user.id)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Nie znaleziono ćwiczenia (lub jest globalne, nie można usunąć)")
    db.delete(exercise)
    db.commit()
```

- [ ] **Step 8: Create `api/routers/workouts.py`**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/routers/workouts.py`:

```python
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models, schemas
from core.database import get_db
from api.deps import get_current_user

router = APIRouter(prefix="/workouts", tags=["Treningi"])


def _to_set_out(set_entry: models.SetEntry) -> schemas.SetOut:
    data = schemas.SetOut.model_validate(set_entry)
    data.exercise_name = set_entry.exercise.name if set_entry.exercise else None
    return data


def _to_workout_out(workout: models.Workout) -> schemas.WorkoutOut:
    out = schemas.WorkoutOut.model_validate(workout)
    out.sets = [_to_set_out(s) for s in workout.sets]
    return out


@router.get("/", response_model=list[schemas.WorkoutOut])
def list_workouts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    workouts = (
        db.query(models.Workout)
        .options(joinedload(models.Workout.sets).joinedload(models.SetEntry.exercise))
        .filter(models.Workout.owner_id == current_user.id)
        .order_by(models.Workout.workout_date.desc(), models.Workout.id.desc())
        .all()
    )
    return [_to_workout_out(w) for w in workouts]


@router.post("/", response_model=schemas.WorkoutOut, status_code=201)
def create_workout(
    workout_in: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    workout = models.Workout(
        owner_id=current_user.id,
        workout_date=workout_in.workout_date or date.today(),
        notes=workout_in.notes,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return _to_workout_out(workout)


def _get_owned_workout(workout_id: int, db: Session, current_user: models.User) -> models.Workout:
    workout = (
        db.query(models.Workout)
        .filter(models.Workout.id == workout_id, models.Workout.owner_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Nie znaleziono treningu")
    return workout


@router.get("/{workout_id}", response_model=schemas.WorkoutOut)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    workout = _get_owned_workout(workout_id, db, current_user)
    return _to_workout_out(workout)


@router.delete("/{workout_id}", status_code=204)
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    workout = _get_owned_workout(workout_id, db, current_user)
    db.delete(workout)
    db.commit()


@router.post("/{workout_id}/sets", response_model=schemas.SetOut, status_code=201)
def add_set(
    workout_id: int,
    set_in: schemas.SetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    workout = _get_owned_workout(workout_id, db, current_user)

    exercise = db.query(models.Exercise).filter(models.Exercise.id == set_in.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Nie znaleziono ćwiczenia")

    set_entry = models.SetEntry(
        workout_id=workout.id,
        exercise_id=set_in.exercise_id,
        set_number=set_in.set_number,
        reps=set_in.reps,
        weight_kg=set_in.weight_kg,
        rpe=set_in.rpe,
    )
    db.add(set_entry)
    db.commit()
    db.refresh(set_entry)
    return _to_set_out(set_entry)


@router.delete("/sets/{set_id}", status_code=204)
def delete_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    set_entry = (
        db.query(models.SetEntry)
        .join(models.Workout)
        .filter(models.SetEntry.id == set_id, models.Workout.owner_id == current_user.id)
        .first()
    )
    if not set_entry:
        raise HTTPException(status_code=404, detail="Nie znaleziono serii")
    db.delete(set_entry)
    db.commit()
```

- [ ] **Step 9: Delete the old flat files and the old `routers/` package**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
rm database.py auth.py
rm -rf routers
```

- [ ] **Step 10: Update `main.py`**

Replace the contents of `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, exercises, workouts

app = FastAPI(
    title="Gym Tracker API",
    description="Backend do zliczania powtórzeń, serii i ciężarów na siłowni",
    version="0.1.0",
)

# CORS - na start otwarte, docelowo ogranicz do domeny swojego frontendu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok"}
```

(The `plans` router is added in Task 7 — not here.)

- [ ] **Step 11: Update `models.py`'s import**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/models.py`, change:

```python
from database import Base
```

to:

```python
from core.database import Base
```

- [ ] **Step 12: Update `seed_exercises.py`'s import**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/seed_exercises.py`, change:

```python
from database import SessionLocal
```

to:

```python
from core.database import SessionLocal
```

(This file itself moves to `scripts/` in Task 3 — fixing the import now keeps `test_seed_excercises.py`, which imports from this module, passing in the meantime.)

- [ ] **Step 13: Update `test_auth.py`'s imports**

Replace the contents of `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/test_auth.py`:

```python
import time

from jose import jwt

from core import security
from core.config import settings


def test_hash_password_produces_different_hash_each_time():
    #bcrypt losuje seed, więc identyczne hasło daje różne hashe.
    hashed1 = security.hash_password("mypassword123")
    hashed2 = security.hash_password("mypassword123")
    assert hashed1 != hashed2


def test_verify_password_accepts_correct_password():
    hashed = security.hash_password("correct-horse-battery-staple")
    assert security.verify_password("correct-horse-battery-staple", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = security.hash_password("correct-horse-battery-staple")
    assert security.verify_password("wrong-password", hashed) is False


def test_create_access_token_contains_subject_and_is_decodable():
    token = security.create_access_token(data={"sub": "42"})
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["sub"] == "42"
    assert "exp" in payload


def test_create_access_token_expiry_is_in_the_future():
    token = security.create_access_token(data={"sub": "1"})
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    assert payload["exp"] > time.time()
```

- [ ] **Step 14: Fix the CI workflow's hardcoded path**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/.github/workflows/CI.yaml`, change:

```yaml
    defaults:
      run:
        working-directory: Backend/app
```

to:

```yaml
    defaults:
      run:
        working-directory: backend/app
```

- [ ] **Step 15: Verify — run the full test suite**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m pytest -v
```

Expected: `13 passed` (5 in `test_auth.py`, 6 in `test_schemas.py`, 2 in `test_seed_excercises.py`), no errors.

- [ ] **Step 16: Verify — boot the server and hit `/health`**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!
sleep 2
curl -s http://localhost:8000/health
echo
kill $UVICORN_PID
```

Expected: `{"status":"ok"}`

- [ ] **Step 17: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add -A -- backend .github/workflows/CI.yaml
git status --short -- backend | grep -v '/venv/' | head -50
git commit -m "refactor(backend): rename Backend to backend, split into core/+api/ packages"
```

(The `git status` line is a sanity check before committing — confirm the listed changes are all source files, not accidental venv noise. venv contents are gitignored as of Task 1, so `git add -A -- backend` will not re-stage them.)

---

## Task 3: Move seed script and tests into subpackages, add `pytest.ini`

**Files:**
- Create: `backend/app/scripts/__init__.py`, `backend/app/scripts/seed_exercises.py`
- Delete: `backend/app/seed_exercises.py`
- Create: `backend/app/tests/__init__.py`, `backend/app/tests/test_auth.py`, `backend/app/tests/test_schemas.py`, `backend/app/tests/test_seed_exercises.py`
- Delete: `backend/app/test_auth.py`, `backend/app/test_schemas.py`, `backend/app/test_seed_excercises.py`
- Create: `backend/app/pytest.ini`

**Interfaces:**
- Consumes: `core.database.SessionLocal` and `models` (from Task 2), the fixed `test_auth.py` content (from Task 2 Step 13).
- Produces: `scripts.seed_exercises.DEFAULT_EXERCISES`, `scripts.seed_exercises.run()` — used by Task 8's manual verification if re-seeding is ever needed (it won't be, DB is already seeded).

- [ ] **Step 1: Create `pytest.ini` so tests can import top-level modules regardless of pytest's rootdir**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/pytest.ini`:

```ini
[pytest]
pythonpath = .
```

- [ ] **Step 2: Move and fix the seed script**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/scripts/__init__.py` (empty file).

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/scripts/seed_exercises.py`:

```python
"""
Jednorazowy skrypt wypełniający bazę popularnymi, globalnymi ćwiczeniami.
Uruchom po migracjach: python -m scripts.seed_exercises
"""
from core.database import SessionLocal
import models

DEFAULT_EXERCISES = [
    ("Przysiad ze sztangą", "nogi"),
    ("Martwy ciąg", "plecy/nogi"),
    ("Wyciskanie sztangi na ławce płaskiej", "klatka piersiowa"),
    ("Wyciskanie sztangi na ławce skos dodatni", "klatka piersiowa"),
    ("Wyciskanie hantli na ławce płaskiej", "klatka piersiowa"),
    ("Wyciskanie hantli na ławce skos dodatni", "klatka piersiowa"),
    ("Wyciskanie żołnierskie (OHP)", "barki"),
    ("Podciąganie na drążku", "plecy"),
    ("Wiosłowanie sztangą", "plecy"),
    ("Uginanie ramion ze sztangą", "biceps"),
    ("Wyciskanie francuskie", "triceps"),
    ("Wykroki", "nogi"),
    ("Hip thrust", "pośladki"),
    ("Plank", "brzuch"),
    ("Wznosy hantli bokiem", "barki"),
    ("Dipy na poręczach", "triceps/klatka"),
    ("Uginanie nóg leżąc", "nogi (dwugłowy)"),
    ("Prostowanie nóg siedząc", "nogi (czworogłowy)"),
]


def run():
    db = SessionLocal()
    try:
        existing_names = {e.name for e in db.query(models.Exercise).filter(models.Exercise.is_global == True)}
        added = 0
        for name, muscle_group in DEFAULT_EXERCISES:
            if name in existing_names:
                continue
            db.add(models.Exercise(name=name, muscle_group=muscle_group, is_global=True, owner_id=None))
            added += 1
        db.commit()
        print(f"Dodano {added} nowych globalnych ćwiczeń.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
```

```bash
rm /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/seed_exercises.py
```

- [ ] **Step 3: Move the test files, fixing the seed-script import**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/tests/__init__.py` (empty file).

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/tests/test_auth.py` with the exact content already written in Task 2 Step 13 (the version importing `from core import security` / `from core.config import settings`).

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/tests/test_schemas.py`:

```python
import pytest
from pydantic import ValidationError

import schemas


def test_user_create_accepts_valid_email():
    user = schemas.UserCreate(email="test@example.com", password="secret123")
    assert user.email == "test@example.com"


def test_user_create_rejects_invalid_email():
    with pytest.raises(ValidationError):
        schemas.UserCreate(email="not-an-email", password="secret123")


def test_user_create_display_name_is_optional():
    user = schemas.UserCreate(email="test@example.com", password="secret123")
    assert user.display_name is None


def test_set_create_defaults_set_number_to_one():
    s = schemas.SetCreate(exercise_id=1, reps=10)
    assert s.set_number == 1
    assert s.weight_kg is None
    assert s.rpe is None


def test_set_create_requires_reps():
    with pytest.raises(ValidationError):
        schemas.SetCreate(exercise_id=1)


def test_workout_create_allows_all_fields_to_be_omitted():
    w = schemas.WorkoutCreate()
    assert w.workout_date is None
    assert w.notes is None
```

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/tests/test_seed_exercises.py`:

```python
from scripts.seed_exercises import DEFAULT_EXERCISES


def test_default_exercises_have_name_and_muscle_group():
    assert len(DEFAULT_EXERCISES) > 0
    for name, muscle_group in DEFAULT_EXERCISES:
        assert isinstance(name, str) and name.strip() != ""
        assert isinstance(muscle_group, str) and muscle_group.strip() != ""


def test_default_exercises_have_no_duplicate_names():
    names = [name for name, _ in DEFAULT_EXERCISES]
    assert len(names) == len(set(names))
```

```bash
rm /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/test_auth.py
rm /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/test_schemas.py
rm /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/test_seed_excercises.py
```

- [ ] **Step 4: Verify — run the full test suite from the new layout**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m pytest -v
```

Expected: `13 passed`, same count as before — confirms `pytest.ini`'s `pythonpath = .` correctly resolves `core`, `models`, `schemas`, and `scripts` imports from inside `tests/`.

- [ ] **Step 5: Verify — the seed script still runs standalone**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m scripts.seed_exercises
```

Expected: `Dodano 0 nowych globalnych ćwiczeń.` (the 18 exercises are already seeded from earlier manual setup, so re-running adds none — a `0` here confirms the script *ran successfully*, not that it did nothing wrong).

- [ ] **Step 6: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add backend/app/scripts backend/app/tests backend/app/pytest.ini
git rm backend/app/seed_exercises.py backend/app/test_auth.py backend/app/test_schemas.py backend/app/test_seed_excercises.py
git commit -m "refactor(backend): move seed script and tests into scripts/ and tests/ packages"
```

---

## Task 4: Fix `alembic/env.py` imports, verify migrations still apply

**Files:**
- Modify: `backend/app/alembic/env.py`

**Interfaces:**
- Consumes: `core.database.Base`, `core.config.settings` (from Task 2).
- Produces: nothing new — this just keeps Alembic working so Task 5 can generate a migration.

- [ ] **Step 1: Update the import**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/alembic/env.py`, change:

```python
from database import Base, settings
```

to:

```python
from core.database import Base
from core.config import settings
```

- [ ] **Step 2: Verify — alembic can read the config and connect**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m alembic current
```

Expected: prints `a92b45c79bbe (head)` (or just `a92b45c79bbe`) with no import errors or tracebacks — confirms `env.py` successfully imported `core.database`/`core.config` and connected to the database.

- [ ] **Step 3: Verify — upgrade is a safe no-op at head**

```bash
venv/bin/python3 -m alembic upgrade head
```

Expected: only `INFO` log lines (e.g. `Context impl PostgresqlImpl`, `Will assume transactional DDL`), no `Running upgrade` line and no errors — since the database is already at head, this confirms nothing is broken without applying any new migration.

- [ ] **Step 4: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add backend/app/alembic/env.py
git commit -m "refactor(backend): fix alembic env.py imports after core/ restructure"
```

---

## Task 5: Add `WorkoutPlan`/`PlanExercise` models, generate and apply the migration

**Files:**
- Modify: `backend/app/models.py`

**Interfaces:**
- Consumes: `core.database.Base` (from Task 2).
- Produces (for Tasks 6-8):
  - `models.WorkoutPlan` — columns `id, owner_id, name, created_at`; relationship `plan_exercises` (ordered by `order_index`, cascade delete-orphan)
  - `models.PlanExercise` — columns `id, plan_id, exercise_id, order_index, target_sets, target_reps`; relationships `plan`, `exercise`
  - `models.Workout.plan_id` — nullable FK to `workout_plans.id`, `ondelete="SET NULL"`

**Important product requirement** (from the existing frontend's own delete-confirmation copy in `Plans.jsx`: *"Usuń ten plan? Treningi już zapisane na jego podstawie zostaną — usuwasz tylko szablon."* — "Delete this plan? Workouts already saved from it will remain — you're only deleting the template."): deleting a `WorkoutPlan` must **not** fail or cascade-delete any `Workout` that was started from it. The FK must be `ondelete="SET NULL"` at the database level, both in the SQLAlchemy column definition and in the Alembic migration — otherwise Postgres's default `RESTRICT` behavior would make deleting a plan with existing workouts fail with a foreign key violation.

- [ ] **Step 1: Add the `workout_plans` relationship to `User`**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/models.py`, change:

```python
    workouts = relationship("Workout", back_populates="owner", cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="owner", cascade="all, delete-orphan")
```

to:

```python
    workouts = relationship("Workout", back_populates="owner", cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="owner", cascade="all, delete-orphan")
    workout_plans = relationship("WorkoutPlan", back_populates="owner", cascade="all, delete-orphan")
```

- [ ] **Step 2: Add `plan_id` to `Workout`**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/models.py`, change:

```python
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_date = Column(Date, default=date.today, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="workouts")
```

to:

```python
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_date = Column(Date, default=date.today, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    plan_id = Column(Integer, ForeignKey("workout_plans.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("User", back_populates="workouts")
```

- [ ] **Step 3: Append the two new model classes**

At the end of `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/models.py`, after the `SetEntry` class, add:

```python


class WorkoutPlan(Base):
    """Szablon treningu: lista ćwiczeń z docelową liczbą serii/powtórzeń."""

    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="workout_plans")
    plan_exercises = relationship(
        "PlanExercise",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="PlanExercise.order_index",
    )


class PlanExercise(Base):
    """Pojedyncze ćwiczenie w planie, z docelową liczbą serii/powtórzeń."""

    __tablename__ = "plan_exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    target_sets = Column(Integer, nullable=True)
    target_reps = Column(Integer, nullable=True)

    plan = relationship("WorkoutPlan", back_populates="plan_exercises")
    exercise = relationship("Exercise")
```

- [ ] **Step 4: Generate the migration**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m alembic revision --autogenerate -m "add workout plans"
```

Expected: a new file appears at `backend/app/alembic/versions/<generated_hash>_add_workout_plans.py`, with `down_revision: Union[str, None] = 'a92b45c79bbe'`.

- [ ] **Step 5: Inspect the generated migration against the expected shape**

Open the newly generated file and confirm its `upgrade()` matches this shape (exact column/constraint order may vary slightly, but it must contain all of these operations — if `ondelete='SET NULL'` is missing from the `workouts.plan_id` foreign key, add it manually):

```python
def upgrade() -> None:
    op.create_table('workout_plans',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workout_plans_id'), 'workout_plans', ['id'], unique=False)
    op.create_table('plan_exercises',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('plan_id', sa.Integer(), nullable=False),
    sa.Column('exercise_id', sa.Integer(), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('target_sets', sa.Integer(), nullable=True),
    sa.Column('target_reps', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ),
    sa.ForeignKeyConstraint(['plan_id'], ['workout_plans.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plan_exercises_id'), 'plan_exercises', ['id'], unique=False)
    op.add_column('workouts', sa.Column('plan_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'workouts', 'workout_plans', ['plan_id'], ['id'], ondelete='SET NULL')
```

And `downgrade()` must reverse it (drop the FK, drop the column, drop both new tables and their indexes) — Alembic's autogenerate produces this automatically; just confirm it's present and symmetrical.

If autogenerate did **not** include `ondelete='SET NULL'` on the `workouts` foreign key (common — Alembic doesn't always detect `ondelete` from the model on a plain `add_column`+`create_foreign_key` diff), manually edit that line in the generated file to add `ondelete='SET NULL'`.

- [ ] **Step 6: Apply the migration**

```bash
venv/bin/python3 -m alembic upgrade head
```

Expected: `INFO` lines ending with `Running upgrade a92b45c79bbe -> <new_hash>, add workout plans`, no errors.

- [ ] **Step 7: Verify — the new tables exist and the FK behaves correctly**

```bash
/opt/homebrew/opt/postgresql@16/bin/psql gym_tracker -c "\d workout_plans"
/opt/homebrew/opt/postgresql@16/bin/psql gym_tracker -c "\d plan_exercises"
/opt/homebrew/opt/postgresql@16/bin/psql gym_tracker -c "\d workouts" | grep -A1 plan_id
```

Expected: `workout_plans` and `plan_exercises` tables listed with their columns; the `workouts` table's foreign-key section shows a constraint on `plan_id` referencing `workout_plans(id)` with `ON DELETE SET NULL`.

- [ ] **Step 8: Run the full test suite once more (models changed, nothing should break)**

```bash
venv/bin/python3 -m pytest -v
```

Expected: `13 passed`.

- [ ] **Step 9: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add backend/app/models.py backend/app/alembic/versions/
git commit -m "feat(backend): add WorkoutPlan and PlanExercise models + migration"
```

---

## Task 6: Add Plan schemas with tests

**Files:**
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/tests/test_schemas.py`

**Interfaces:**
- Consumes: nothing from models directly (Pydantic schemas are independent of SQLAlchemy models).
- Produces (for Task 7):
  - `schemas.PlanExerciseCreate(exercise_id: int, order_index: int = 0, target_sets: int | None = None, target_reps: int | None = None)`
  - `schemas.PlanExerciseOut` — same fields plus `id: int`, `exercise_name: str | None = None`
  - `schemas.WorkoutPlanCreate(name: str, exercises: list[PlanExerciseCreate] = [])`
  - `schemas.WorkoutPlanOut(id: int, name: str, created_at: datetime, exercises: list[PlanExerciseOut] = [])`
  - `schemas.WorkoutOut` gains `plan_id: int | None = None`

- [ ] **Step 1: Write the failing tests**

Append to `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/tests/test_schemas.py`:

```python


def test_plan_exercise_create_defaults_order_index_to_zero():
    pe = schemas.PlanExerciseCreate(exercise_id=1)
    assert pe.order_index == 0
    assert pe.target_sets is None
    assert pe.target_reps is None


def test_plan_exercise_create_requires_exercise_id():
    with pytest.raises(ValidationError):
        schemas.PlanExerciseCreate()


def test_workout_plan_create_allows_empty_exercise_list():
    plan = schemas.WorkoutPlanCreate(name="Push day")
    assert plan.exercises == []


def test_workout_plan_create_requires_name():
    with pytest.raises(ValidationError):
        schemas.WorkoutPlanCreate(exercises=[])
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m pytest tests/test_schemas.py -v
```

Expected: the 4 new tests `FAIL` with `AttributeError: module 'schemas' has no attribute 'PlanExerciseCreate'` (or similar), the original 6 tests still `PASS`.

- [ ] **Step 3: Implement the schemas**

Append to `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/schemas.py`:

```python


# ---------- Plan ----------

class PlanExerciseCreate(BaseModel):
    exercise_id: int
    order_index: int = 0
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None


class PlanExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exercise_id: int
    exercise_name: Optional[str] = None
    order_index: int
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None


class WorkoutPlanCreate(BaseModel):
    name: str
    exercises: list[PlanExerciseCreate] = []


class WorkoutPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    exercises: list[PlanExerciseOut] = []
```

Also add `plan_id` to `WorkoutOut`. Change:

```python
class WorkoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_date: date
    notes: Optional[str] = None
    created_at: datetime
    sets: list[SetOut] = []
```

to:

```python
class WorkoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workout_date: date
    notes: Optional[str] = None
    created_at: datetime
    plan_id: Optional[int] = None
    sets: list[SetOut] = []
```

Note: `WorkoutCreate` is **not** changed — the frontend always sends an empty body (`{}`) to `POST /workouts/`; `plan_id` is only ever set server-side, by the `/plans/{id}/start` endpoint in Task 7.

- [ ] **Step 4: Run tests to verify they pass**

```bash
venv/bin/python3 -m pytest tests/test_schemas.py -v
```

Expected: `10 passed` (6 original + 4 new).

- [ ] **Step 5: Run the full suite**

```bash
venv/bin/python3 -m pytest -v
```

Expected: `13 passed` (the schema file total went from 6→10, but this counts distinct test functions across all files: 5 in `test_auth.py` + 10 in `test_schemas.py` + 2 in `test_seed_exercises.py` = 17 passed). Use the actual printed count as ground truth, not the arithmetic here.

- [ ] **Step 6: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add backend/app/schemas.py backend/app/tests/test_schemas.py
git commit -m "feat(backend): add Plan schemas with validation tests"
```

---

## Task 7: Implement the plans router, register it in `main.py`

**Files:**
- Create: `backend/app/api/routers/plans.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `models.WorkoutPlan`, `models.PlanExercise` (Task 5); `schemas.WorkoutPlanCreate`, `schemas.WorkoutPlanOut`, `schemas.PlanExerciseOut`, `schemas.WorkoutOut` (Task 6); `core.database.get_db`, `api.deps.get_current_user` (Task 2).
- Produces: `router` (FastAPI `APIRouter`, prefix `/plans`) with 5 endpoints, matching exactly what `Frontend_new/src/pages/Plans.jsx` and `Frontend_new/src/pages/WorkoutDetail.jsx` already call:
  - `GET /plans/` → `list[WorkoutPlanOut]`
  - `POST /plans/` (body: `WorkoutPlanCreate`) → `WorkoutPlanOut`, 201
  - `GET /plans/{plan_id}` → `WorkoutPlanOut`
  - `DELETE /plans/{plan_id}` → 204
  - `POST /plans/{plan_id}/start` → `WorkoutOut`, 201

- [ ] **Step 1: Create the router**

Create `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/api/routers/plans.py`:

```python
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models, schemas
from core.database import get_db
from api.deps import get_current_user

router = APIRouter(prefix="/plans", tags=["Plany"])


def _to_plan_exercise_out(plan_exercise: models.PlanExercise) -> schemas.PlanExerciseOut:
    data = schemas.PlanExerciseOut.model_validate(plan_exercise)
    data.exercise_name = plan_exercise.exercise.name if plan_exercise.exercise else None
    return data


def _to_plan_out(plan: models.WorkoutPlan) -> schemas.WorkoutPlanOut:
    out = schemas.WorkoutPlanOut.model_validate(plan)
    out.exercises = [_to_plan_exercise_out(pe) for pe in plan.plan_exercises]
    return out


def _get_owned_plan(plan_id: int, db: Session, current_user: models.User) -> models.WorkoutPlan:
    plan = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.plan_exercises).joinedload(models.PlanExercise.exercise))
        .filter(models.WorkoutPlan.id == plan_id, models.WorkoutPlan.owner_id == current_user.id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Nie znaleziono planu")
    return plan


@router.get("/", response_model=list[schemas.WorkoutPlanOut])
def list_plans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plans = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.plan_exercises).joinedload(models.PlanExercise.exercise))
        .filter(models.WorkoutPlan.owner_id == current_user.id)
        .order_by(models.WorkoutPlan.created_at.desc())
        .all()
    )
    return [_to_plan_out(p) for p in plans]


@router.post("/", response_model=schemas.WorkoutPlanOut, status_code=201)
def create_plan(
    plan_in: schemas.WorkoutPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = models.WorkoutPlan(owner_id=current_user.id, name=plan_in.name)
    for pe_in in plan_in.exercises:
        plan.plan_exercises.append(
            models.PlanExercise(
                exercise_id=pe_in.exercise_id,
                order_index=pe_in.order_index,
                target_sets=pe_in.target_sets,
                target_reps=pe_in.target_reps,
            )
        )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return _to_plan_out(plan)


@router.get("/{plan_id}", response_model=schemas.WorkoutPlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(plan_id, db, current_user)
    return _to_plan_out(plan)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(plan_id, db, current_user)
    db.delete(plan)
    db.commit()


@router.post("/{plan_id}/start", response_model=schemas.WorkoutOut, status_code=201)
def start_workout_from_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = _get_owned_plan(plan_id, db, current_user)
    workout = models.Workout(
        owner_id=current_user.id,
        workout_date=date.today(),
        plan_id=plan.id,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)

    out = schemas.WorkoutOut.model_validate(workout)
    out.sets = []
    return out
```

- [ ] **Step 2: Register the router**

In `/Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app/main.py`, change:

```python
from api.routers import auth, exercises, workouts
```

to:

```python
from api.routers import auth, exercises, workouts, plans
```

and change:

```python
app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
```

to:

```python
app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(plans.router)
```

- [ ] **Step 3: Run the full test suite (no test changes expected, this is a sanity check)**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m pytest -v
```

Expected: same pass count as the end of Task 6, no failures.

- [ ] **Step 4: Commit**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app
git add backend/app/api/routers/plans.py backend/app/main.py
git commit -m "feat(backend): implement /plans router and register it"
```

---

## Task 8: End-to-end verification — full test suite + comprehensive `curl` smoke test

This is the task that proves the Plans feature actually works against a running server and a real database, including the plan-delete-preserves-workout behavior that's easy to get wrong.

**Files:** none (verification only)

**Interfaces:**
- Consumes: the running application as a whole (all previous tasks).
- Produces: nothing — this is the final check before moving to the frontend plan.

- [ ] **Step 1: Run the full test suite one last time**

```bash
cd /Users/bartlomiejmika/Desktop/Work/app/gym-app/backend/app
venv/bin/python3 -m pytest -v
```

Expected: all tests pass, 0 failures.

- [ ] **Step 2: Boot the server**

```bash
venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!
sleep 2
curl -s http://localhost:8000/health
echo
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Log in (rotating the secret in Task 1 invalidated old tokens, so get a fresh one)**

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=smoketest@example.com&password=testpass123" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token acquired: ${TOKEN:0:15}..."
```

Expected: a truncated token prefix is printed, no error. (If this user doesn't exist in your environment, register one first: `curl -s -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d '{"email":"smoketest@example.com","password":"testpass123","display_name":"Smoke Test"}'`.)

- [ ] **Step 4: Get an exercise id to build a plan with**

```bash
EXERCISE_ID=$(curl -s http://localhost:8000/exercises/ -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
echo "Using exercise id: $EXERCISE_ID"
```

Expected: prints a numeric id (one of the 18 seeded global exercises).

- [ ] **Step 5: Create a plan**

```bash
PLAN_JSON=$(curl -s -X POST http://localhost:8000/plans/ \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Push day\",\"exercises\":[{\"exercise_id\":$EXERCISE_ID,\"order_index\":0,\"target_sets\":3,\"target_reps\":10}]}")
echo "$PLAN_JSON"
PLAN_ID=$(echo "$PLAN_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Created plan id: $PLAN_ID"
```

Expected: JSON with `"name":"Push day"` and one entry in `"exercises"` whose `"exercise_name"` matches the seeded exercise (confirms the `exercise_name` join-and-populate logic works).

- [ ] **Step 6: List plans and fetch the single plan**

```bash
curl -s http://localhost:8000/plans/ -H "Authorization: Bearer $TOKEN"
echo
curl -s http://localhost:8000/plans/$PLAN_ID -H "Authorization: Bearer $TOKEN"
echo
```

Expected: both return the plan created in Step 5.

- [ ] **Step 7: Start a workout from the plan**

```bash
WORKOUT_JSON=$(curl -s -X POST http://localhost:8000/plans/$PLAN_ID/start -H "Authorization: Bearer $TOKEN")
echo "$WORKOUT_JSON"
WORKOUT_ID=$(echo "$WORKOUT_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Created workout id: $WORKOUT_ID, expecting plan_id: $PLAN_ID"
```

Expected: JSON with `"plan_id"` equal to `$PLAN_ID` and `"sets":[]` — confirms `WorkoutDetail.jsx`'s `if (workoutData.plan_id) { ... }` branch (which fetches the plan and pre-fills the add-set form) will actually trigger.

- [ ] **Step 8: Delete the plan and confirm the workout survives with `plan_id` nulled out**

This is the critical check for the `ondelete="SET NULL"` behavior from Task 5:

```bash
curl -s -o /dev/null -w "delete plan status: %{http_code}\n" -X DELETE http://localhost:8000/plans/$PLAN_ID -H "Authorization: Bearer $TOKEN"

curl -s http://localhost:8000/workouts/$WORKOUT_ID -H "Authorization: Bearer $TOKEN"
echo
```

Expected: `delete plan status: 204`, and the second call returns **200** with the workout JSON showing `"plan_id":null` — **not** a 500 error and **not** a deleted workout. If this returns a 500 or a foreign-key-violation error instead, the migration's `ondelete='SET NULL'` from Task 5 Step 5 wasn't applied correctly — go back and fix it.

- [ ] **Step 9: Clean up the smoke-test workout and stop the server**

```bash
curl -s -o /dev/null -w "delete workout status: %{http_code}\n" -X DELETE http://localhost:8000/workouts/$WORKOUT_ID -H "Authorization: Bearer $TOKEN"
kill $UVICORN_PID
```

Expected: `delete workout status: 204`.

- [ ] **Step 10: Final commit checkpoint**

No files change in this task — nothing to commit. If Step 8 required a fix, go back and commit that fix as part of Task 5 (amend is fine only if that commit hasn't been reviewed/merged yet; otherwise create a new small commit `fix(backend): correct plan_id ondelete behavior`).

---

## Definition of done

- `git log --oneline` shows the sequence of commits from Tasks 1-7 (Task 8 is verification-only).
- `backend/app/` no longer exists as `Backend/app/` anywhere in git.
- `venv/bin/python3 -m pytest -v` run from `backend/app/` passes with 0 failures.
- The server boots and all of Task 8's curl checks pass, including the plan-delete-preserves-workout check.
- `git status --short` shows no unexpected tracked venv/node_modules/`__pycache__`/`.env` entries.
- The frontend restructure plan (next, separate plan document) can now build against a working `/plans/*` API.
