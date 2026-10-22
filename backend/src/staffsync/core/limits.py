from slowapi import Limiter
from slowapi.util import get_remote_address

from staffsync.core.config import get_settings


def _key(request):
    return get_remote_address(request)


limiter = Limiter(key_func=_key, storage_uri=get_settings().redis_url, enabled=get_settings().app_env != "test")
