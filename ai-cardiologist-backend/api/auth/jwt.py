"""JWT session tokens — pattern from FrenchCoachPro-backend/api/auth/jwt.py."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

SECRET = os.getenv("JWT_SECRET", "dev-ai-cardiologist-secret-change-in-production")
ALGORITHM = "HS256"
TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "24"))


def sign_session_token(*, sub: str, tenant_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "tid": tenant_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=TTL_HOURS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def verify_session_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
