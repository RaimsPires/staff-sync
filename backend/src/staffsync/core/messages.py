"""English source text for messages chosen by error code, HTTP status or validation type.

`N_` only marks strings for `pybabel extract`; translation happens in `i18n`. Fixed sentences passed to
`NotFound(text)`, `Conflict(text)` etc. are extracted straight from the raise sites (see `make i18n`).
Placeholders use `%(name)s`.
"""


def N_(text: str) -> str:
    return text


def NN_(singular: str, plural: str, count_param: str) -> tuple[str, str, str]:
    """Marks a plural pair for extraction; `count_param` names the parameter that selects the form."""
    return singular, plural, count_param


_BAD_INPUT = N_("We couldn't process this request. Please check your input and try again.")
_SIGN_IN = N_("Please sign in to continue.")
_FORBIDDEN = N_("You don't have permission to do this.")
_NOT_FOUND = N_("We couldn't find what you were looking for.")
_NOT_AVAILABLE = N_("This action isn't available.")
_CONFLICT = N_("This conflicts with existing data. Please refresh and try again.")
_NOT_ALLOWED = N_("This action isn't allowed in the current situation.")
_UPDATE = N_("Please update the app to continue.")
_SLOW_DOWN = N_("You're doing that too often. Please wait a moment and try again.")
_OUR_SIDE = N_("Something went wrong on our side. Please try again in a moment.")
_UNAVAILABLE = N_("The service is temporarily unavailable. Please try again shortly.")

# A str is a plain message; a tuple is (singular, plural, name of the count parameter).
CODE_MESSAGES: dict[str, str | tuple[str, str, str]] = {
    "BAD_REQUEST": _BAD_INPUT,
    "VALIDATION": N_("Some of the information you entered isn't valid. Please review it and try again."),
    "UNAUTHENTICATED": _SIGN_IN,
    "FORBIDDEN": _FORBIDDEN,
    "NOT_FOUND": _NOT_FOUND,
    "METHOD_NOT_ALLOWED": _NOT_AVAILABLE,
    "CONFLICT": _CONFLICT,
    "BUSINESS_RULE": _NOT_ALLOWED,
    "UPGRADE_REQUIRED": _UPDATE,
    "RATE_LIMITED": _SLOW_DOWN,
    "INTERNAL_ERROR": _OUR_SIDE,
    "ROW_INVALID": N_("This row is not valid."),
    "INVALID_POLYGON": N_("The drawn area is not valid. Make sure its edges do not cross."),
    "AREA_OUT_OF_RANGE": N_("The area must be between %(min_m2)s m² and %(max_km2)s km²."),
    "MISSING_PERMISSION": _FORBIDDEN,
    "UNKNOWN_SETTINGS": N_("Some settings are not recognised: %(names)s."),
    "SETTING_WRONG_TYPE": N_('The value for "%(key)s" is not valid.'),
    "SSO_NOT_CONFIGURED": N_("Sign-in with %(provider)s isn't set up."),
    "ROLE_IN_USE": NN_("%(count)d user still has this role.", "%(count)d users still have this role.", "count"),
    "INVALID_TRANSITION": N_("This action isn't possible from the current status."),
    "UNKNOWN_EVENTS": N_("Unknown events: %(names)s."),
    "TOO_MANY_ROWS": N_("An import can contain at most %(max_rows)s rows."),
    "BRANCH_NOT_EMPTY": N_("Reassign the sites and employees of this branch first."),
    "DUPLICATE_EMPLOYEE_NO": N_("Duplicate employee number in the file."),
    "ACCOUNT_DISABLED": N_("This account is disabled. Contact your administrator."),
}

STATUS_MESSAGES: dict[int, str] = {
    400: _BAD_INPUT,
    401: _SIGN_IN,
    403: _FORBIDDEN,
    404: _NOT_FOUND,
    405: _NOT_AVAILABLE,
    409: _CONFLICT,
    413: N_("The file or request is too large."),
    422: _NOT_ALLOWED,
    426: _UPDATE,
    429: _SLOW_DOWN,
    500: _OUR_SIDE,
    502: _UNAVAILABLE,
    503: _UNAVAILABLE,
}

TITLES: dict[int, str] = {
    400: N_("Check your input"),
    401: N_("Sign-in required"),
    403: N_("Not allowed"),
    404: N_("Not found"),
    405: N_("Not available"),
    409: N_("Conflict"),
    422: N_("Not allowed"),
    426: N_("Update required"),
    429: N_("Too many requests"),
    500: N_("Something went wrong"),
}

FLAG_REASONS: dict[str, str] = {
    "MOCK_LOCATION": N_("Fake location detected"),
    "TIME_TAMPERED": N_("Device clock was changed"),
    "IMPOSSIBLE_TRAVEL": N_("Impossible travel between check-ins"),
    "DEVICE_MISMATCH": N_("Unregistered device"),
    "LATE_SYNC": N_("Check-in synced late"),
    "LOW_ACCURACY": N_("Location accuracy too low"),
    "OUTSIDE_GEOFENCE": N_("Outside the site area"),
    "QR_INVALID": N_("Invalid QR code"),
    "SELFIE_MISSING": N_("Selfie missing"),
    "UNSCHEDULED": N_("No shift scheduled"),
    "MISSING_CHECKOUT": N_("Missing check-out"),
}

VALIDATION_MESSAGES: dict[str, str] = {
    "missing": N_("This field is required."),
    "string_too_short": N_("This is too short."),
    "string_too_long": N_("This is too long."),
    "string_pattern_mismatch": N_("This doesn't have the expected format."),
    "value_error": N_("This value isn't valid."),
    "greater_than": N_("This value is too small."),
    "greater_than_equal": N_("This value is too small."),
    "less_than": N_("This value is too large."),
    "less_than_equal": N_("This value is too large."),
    "int_parsing": N_("Enter a whole number."),
    "int_type": N_("Enter a whole number."),
    "float_parsing": N_("Enter a number."),
    "bool_parsing": N_("Choose yes or no."),
    "uuid_parsing": N_("This identifier isn't valid."),
    "date_parsing": N_("Enter a valid date."),
    "date_from_datetime_parsing": N_("Enter a valid date."),
    "datetime_parsing": N_("Enter a valid date and time."),
    "time_parsing": N_("Enter a valid time."),
    "json_invalid": N_("The request body isn't valid."),
    "enum": N_("This isn't one of the allowed values."),
    "literal_error": N_("This isn't one of the allowed values."),
    "too_short": N_("Add more items."),
    "too_long": N_("Too many items."),
    "extra_forbidden": N_("This field isn't allowed."),
    "default": N_("This value isn't valid."),
}
