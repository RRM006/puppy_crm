"""Simple Fernet-based encryption helpers for storing email account secrets.

If EMAIL_ENCRYPTION_KEY is missing, functions degrade to passthrough (NOT secure).
"""

from cryptography.fernet import Fernet, InvalidToken  # type: ignore
from django.conf import settings


_KEY = getattr(settings, 'EMAIL_ENCRYPTION_KEY', '')
_FERNET = Fernet(_KEY) if _KEY else None


def encrypt_secret(value: str) -> str:
    if not value:
        return ''
    if not _FERNET:
        return value  # fallback insecure
    return _FERNET.encrypt(value.encode()).decode()


def decrypt_secret(value: str) -> str:
    if not value:
        return ''
    if not _FERNET:
        return value
    try:
        return _FERNET.decrypt(value.encode()).decode()
    except (InvalidToken, Exception):  # noqa: BLE001
        return ''
