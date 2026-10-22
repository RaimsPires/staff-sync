"""RFC 9457 problem-details errors. `code` values match the mobile app's AppError union."""

from typing import Any


class AppError(Exception):
    status = 400
    code = "BAD_REQUEST"
    title = "Bad request"

    def __init__(self, detail: str | None = None, *, code: str | None = None, **extra: Any):
        super().__init__(detail or self.title)
        self.detail = detail or self.title
        if code:
            self.code = code
        self.extra = extra

    def to_problem(self, request_id: str | None = None) -> dict[str, Any]:
        slug = self.code.lower().replace("_", "-")
        body: dict[str, Any] = {
            "type": f"https://api.staffsync.app/errors/{slug}",
            "title": self.title,
            "status": self.status,
            "code": self.code,
            "detail": self.detail,
            "request_id": request_id,
        }
        body.update(self.extra)
        return body


class ValidationFailed(AppError):
    status, code, title = 400, "VALIDATION", "Validation failed"


class Unauthenticated(AppError):
    status, code, title = 401, "UNAUTHENTICATED", "Authentication required"


class Forbidden(AppError):
    status, code, title = 403, "FORBIDDEN", "Action not allowed"


class NotFound(AppError):
    status, code, title = 404, "NOT_FOUND", "Not found"


class Conflict(AppError):
    status, code, title = 409, "CONFLICT", "Conflict"


class BusinessRule(AppError):
    status, code, title = 422, "BUSINESS_RULE", "Business rule violated"


class UpgradeRequired(AppError):
    status, code, title = 426, "UPGRADE_REQUIRED", "App update required"


class RateLimited(AppError):
    status, code, title = 429, "RATE_LIMITED", "Too many requests"
