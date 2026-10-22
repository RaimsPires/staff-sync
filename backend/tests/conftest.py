"""Integration test harness: a throwaway Postgres/PostGIS database + Redis db 15, real migrations, real RLS."""

import os
import subprocess
import sys
from pathlib import Path

# Settings are read at import time, so point everything at the test resources first.
TEST_DB = "staffsync_test"
os.environ.update(
    APP_ENV="test",
    DATABASE_URL=f"postgresql+asyncpg://staffsync_app:staffsync_app@localhost:5433/{TEST_DB}",
    MIGRATION_DATABASE_URL=f"postgresql+asyncpg://staffsync:staffsync@localhost:5433/{TEST_DB}",
    REDIS_URL="redis://localhost:6380/15",
)

import asyncpg  # noqa: E402
import httpx  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session", autouse=True)
def _database():
    import asyncio

    async def recreate():
        conn = await asyncpg.connect("postgresql://staffsync:staffsync@localhost:5433/postgres")
        await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        await conn.execute(f"CREATE DATABASE {TEST_DB}")
        await conn.close()

    asyncio.run(recreate())
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=ROOT, check=True, env=os.environ)
    yield


@pytest_asyncio.fixture(autouse=True)
async def _clean():
    """Empty every table and the test Redis between tests."""
    from staffsync.core.redis import get_redis

    conn = await asyncpg.connect(f"postgresql://staffsync:staffsync@localhost:5433/{TEST_DB}")
    tables = await conn.fetch("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('spatial_ref_sys','alembic_version')")
    await conn.execute("TRUNCATE " + ",".join(f'"{t["tablename"]}"' for t in tables) + " CASCADE")
    await conn.close()
    await get_redis().flushdb()
    yield


@pytest_asyncio.fixture
async def client():
    from staffsync.main import app

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test/api/v1") as c:
        yield c


@pytest.fixture
def mailbox():
    from staffsync.core.adapters import ConsoleNotifier, get_notifier

    notifier = get_notifier()
    assert isinstance(notifier, ConsoleNotifier)
    notifier.sent.clear()
    return notifier.sent
