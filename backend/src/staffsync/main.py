import uuid
from contextlib import asynccontextmanager
from typing import Any

import structlog
from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from staffsync.api import api_router, root_router
from staffsync.core.config import get_settings
from staffsync.core.db import engine
from staffsync.core.deps import check_app_version
from staffsync.core.errors import AppError, RateLimited
from staffsync.core.i18n import set_request_locale, title_for, validation_message
from staffsync.core.limits import limiter
from staffsync.core.logging import configure_logging, get_logger
from staffsync.core.redis import close_redis

PROBLEM = "application/problem+json"


def _field_error(e: dict) -> dict:
    ctx: dict[str, Any] = {k: v for k, v in (e.get("ctx") or {}).items() if isinstance(v, (str, int, float))}
    msg = validation_message(e["type"], **ctx)
    return {"loc": list(e["loc"]), "msg": msg, "type": e["type"]}


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.app_env, traces_sample_rate=0.1)
    yield
    await close_redis()
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    docs = None if settings.is_prod else f"{settings.api_prefix}/docs"
    app = FastAPI(
        title="StaffSync API",
        version="1.0.0",
        lifespan=lifespan,
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=docs,
        redoc_url=None,
    )
    app.state.limiter = limiter

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["ETag", "X-Request-Id"],
    )

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = rid
        set_request_locale(request.headers.get("accept-language"))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=rid, path=request.url.path)
        response = await call_next(request)
        response.headers["X-Request-Id"] = rid
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none'" if request.url.path.startswith(settings.api_prefix + "/docs") is False else response.headers.get("Content-Security-Policy", "")
        if settings.is_prod:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

    def problem(request: Request, err: AppError) -> JSONResponse:
        return JSONResponse(err.to_problem(getattr(request.state, "request_id", None)), status_code=err.status, media_type=PROBLEM)

    @app.exception_handler(AppError)
    async def app_error(request: Request, exc: AppError):
        return problem(request, exc)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limited(request: Request, exc: RateLimitExceeded):
        return problem(request, RateLimited())

    @app.exception_handler(RequestValidationError)
    async def validation(request: Request, exc: RequestValidationError):
        body = AppError(code="VALIDATION").to_problem(getattr(request.state, "request_id", None))
        body.update(status=400, title=title_for(400), errors=[_field_error(e) for e in exc.errors()])
        return JSONResponse(body, status_code=400, media_type=PROBLEM)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException):
        err = AppError(code={404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(exc.status_code, f"STATUS_{exc.status_code}"))
        err.status = exc.status_code  # starlette's own English text is never forwarded
        return problem(request, err)

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception):
        get_logger().exception("unhandled_error", error=str(exc))
        err = AppError(code="INTERNAL_ERROR")
        err.status = 500  # never leak stack traces
        return problem(request, err)

    app.include_router(api_router, prefix=settings.api_prefix, dependencies=[Depends(check_app_version)])
    app.include_router(root_router, prefix=settings.api_prefix)
    return app


app = create_app()
