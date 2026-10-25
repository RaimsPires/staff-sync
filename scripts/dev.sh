#!/usr/bin/env bash
# One command for the whole stack: Postgres + Redis, migrations, API, worker and the admin dashboard.
# The mobile app runs separately (it needs a device or simulator): see the line printed at the end.
#
#   ./scripts/dev.sh            API and admin on localhost
#   ./scripts/dev.sh --seed     also load the demo company (once, on an empty database)
#   ./scripts/dev.sh --lan      listen on the LAN so a phone can reach the API; writes mobile/.env
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD

SEED=0; HOST=127.0.0.1
for arg in "$@"; do
  case $arg in
    --seed) SEED=1 ;;
    --lan) HOST=0.0.0.0 ;;
    *) echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done

command -v uv >/dev/null || { echo "uv is required (https://docs.astral.sh/uv/)" >&2; exit 1; }
command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }

cd "$ROOT/backend"
[ -f .env ] || cp .env.example .env
docker compose up -d --wait
uv run alembic upgrade head
if [ "$SEED" = 1 ]; then uv run python scripts/seed_dev.py || true; fi

cd "$ROOT/admin"
[ -d node_modules ] || yarn install

PIDS=()
cleanup() { for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

cd "$ROOT/backend"
uv run uvicorn staffsync.main:app --reload --reload-dir src --host "$HOST" --port 8000 & PIDS+=($!)
uv run arq staffsync.workers.settings.WorkerSettings & PIDS+=($!)
cd "$ROOT/admin"
yarn dev & PIDS+=($!)

if [ "$HOST" = 0.0.0.0 ]; then
  IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || true)
  if [ -n "$IP" ]; then
    printf 'EXPO_PUBLIC_API_URL=http://%s:8000/api/v1\nEXPO_PUBLIC_USE_MOCK=0\n' "$IP" > "$ROOT/mobile/.env"
    echo "mobile/.env now points at http://$IP:8000/api/v1"
  fi
fi

cat <<MSG

  API      http://localhost:8000/api/v1/docs
  Admin    http://localhost:3000   (owner@staffsync.app / staffsync-demo-1 after --seed)
  Mobile   cd mobile && npx expo run:ios      (first run, or after adding native packages)
           cd mobile && npx expo start        (later runs)
  Stop     Ctrl+C

MSG
wait
