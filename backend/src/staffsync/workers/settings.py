"""ARQ worker: `uv run arq staffsync.workers.settings.WorkerSettings`."""

from arq import cron
from arq.connections import RedisSettings

from staffsync.core.config import get_settings
from staffsync.core.db import session_scope
from staffsync.workers import tasks


def _job(fn):
    async def run(ctx):
        async with session_scope(bypass=True) as s:
            return await fn(s)

    run.__name__ = fn.__name__
    return run


relay, deliver, absences, checkouts, shifts, retention = (_job(f) for f in (tasks.relay_outbox, tasks.deliver_webhooks, tasks.detect_absences, tasks.missing_checkouts, tasks.extend_shifts, tasks.retention))


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(get_settings().redis_url)
    functions = [relay, deliver, absences, checkouts, shifts, retention]
    cron_jobs = [
        cron(relay, second={0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55}),
        cron(deliver, second={0, 30}),
        cron(absences, minute=set(range(0, 60, 5))),
        cron(checkouts, minute={0, 15, 30, 45}),
        cron(shifts, hour={2}, minute={0}),
        cron(retention, hour={3}, minute={30}),
    ]
