#!/usr/bin/env bash
# One command for local development: start Postgres+Redis, migrate, run the API with reload.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || cp .env.example .env
docker compose up -d --wait
uv run alembic upgrade head
exec uv run uvicorn staffsync.main:app --reload --reload-dir src "$@"
