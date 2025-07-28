from datetime import datetime, timezone
from ulid import ULID


def generate_ulid() -> str:
    """Generate a new ULID string"""
    return str(ULID())


def utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)
