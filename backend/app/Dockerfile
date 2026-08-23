# Gorilla API — FastAPI + PostgreSQL
#
# Build context is this directory (backend/app), because that's where
# requirements.txt lives and because the app's imports are flat
# (`from api.routers import ...`), so /app must be this directory's contents.
#
#   docker build -t gorilla-api backend/app
#   docker run --rm -p 8000:8000 --env-file backend/app/.env gorilla-api
#
# Python 3.12, not 3.13+: psycopg2-binary and pydantic are pinned to versions
# without wheels for newer interpreters.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies first, so edits to application code reuse this layer.
# psycopg2-binary ships a manylinux wheel, so no libpq/gcc needed here.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run unprivileged. Done after COPY so the copied files stay root-owned and
# read-only to the app.
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"

# Settings come from the environment (pydantic-settings reads env vars before
# .env), so DATABASE_URL and SECRET_KEY must be passed in at run time.
# Migrations are deliberately NOT run here — run them as a one-off against the
# same image: docker run --rm --env-file .env gorilla-api alembic upgrade head
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
