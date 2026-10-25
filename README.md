# StaffSync

Attendance and workforce platform: a FastAPI backend, a Next.js admin dashboard and an Expo mobile app for employees and site managers.

| Folder | What it is | Docs |
| --- | --- | --- |
| `backend/` | FastAPI + PostgreSQL/PostGIS + Redis + ARQ worker | `backend/README.md`, `Backend API.md` |
| `admin/` | Next.js 16 dashboard (English and French) | `admin/README.md`, `Admin Dashboard.md` |
| `mobile/` | Expo / React Native app (iOS and Android) | `mobile/README.md`, `Mobile App.md` |
| `INTEGRATION-STATUS.md` | What is wired end to end, what is still a stub, change log | |

## Run everything

Needs Docker, `uv` and Node with Yarn.

```bash
./scripts/dev.sh --seed          # database, migrations, demo data, API :8000, worker, admin :3000
./scripts/dev.sh --lan           # later runs; --lan lets a phone reach the API and writes mobile/.env
cd mobile && npx expo run:ios    # first run on a simulator or device; later: npx expo start
```

Demo login: `owner@staffsync.app` / `staffsync-demo-1` (admin). Mobile logins are the seeded phone numbers; the one-time code is printed in the API log.

## Checks

```bash
cd backend && uv run pytest && uv run ruff check src tests
cd admin   && yarn typecheck && yarn lint && yarn i18n:check && yarn keys:check
cd mobile  && npx tsc --noEmit && npx jest
```
