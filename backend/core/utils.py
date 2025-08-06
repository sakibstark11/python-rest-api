from datetime import datetime, timezone
from ulid import ULID


def generate_ulid() -> str:
    return str(ULID())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
