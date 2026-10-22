import logging
import sys

import structlog

SENSITIVE = {"password", "pin", "code", "token", "access_token", "refresh_token", "authorization"}


def _scrub(_, __, event_dict):
    for key in list(event_dict):
        if key.lower() in SENSITIVE:
            event_dict[key] = "***"
    return event_dict


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            _scrub,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "staffsync"):
    return structlog.get_logger(name)
