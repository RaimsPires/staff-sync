"""Company settings live in companies.settings (JSONB); missing keys fall back to these defaults."""

import copy
from typing import Any

DEFAULTS: dict[str, Any] = {
    "attendance": {
        "grace_min": 10,
        "early_leave_tol_min": 10,
        "overtime_threshold_min": 15,
        "auto_checkout_time": None,  # "HH:mm" local, null = off
        "missing_checkout_margin_min": 60,
        "min_accuracy_m": 50,
        "block_mock_location": False,
        "default_require_selfie": False,
        "default_require_qr": False,
        "allow_offline": True,
        "max_sync_delay_h": 48,
        "shift_window_before_min": 120,
        "time_tolerance_s": 300,
        "max_speed_kmh": 200,
        "proxy_requires_pin": True,
    },
    "leave": {"levels": 1, "accrual": "none", "carry_over": True},
    "notifications": {
        "fraud_flag": {"roles": ["owner", "branch_admin", "site_manager"], "channels": ["in_app", "push"]},
        "no_show": {"roles": ["site_manager"], "channels": ["in_app", "push"]},
        "missing_checkout": {"roles": ["branch_admin", "site_manager"], "channels": ["in_app"]},
        "leave_request": {"roles": ["branch_admin", "site_manager"], "channels": ["in_app", "email"]},
        "leave_decision": {"roles": ["employee"], "channels": ["in_app", "push"]},
        "uncovered_intervention": {"roles": ["branch_admin"], "channels": ["in_app"]},
    },
}


def merged(stored: dict | None, section: str) -> dict[str, Any]:
    base = copy.deepcopy(DEFAULTS[section])
    base.update((stored or {}).get(section, {}))
    return base
