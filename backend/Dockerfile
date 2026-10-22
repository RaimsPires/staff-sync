FROM python:3.13-slim AS base
ENV PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1
RUN apt-get update && apt-get install -y --no-install-recommends libmagic1 libpango-1.0-0 libpangoft2-1.0-0 && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
COPY src ./src
COPY alembic.ini ./
RUN uv sync --frozen --no-dev
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
# API:    gunicorn -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000 staffsync.main:app
# Worker: arq staffsync.workers.settings.WorkerSettings
# Release step (before rollout): alembic upgrade head
CMD ["uvicorn", "staffsync.main:app", "--host", "0.0.0.0", "--port", "8000"]
