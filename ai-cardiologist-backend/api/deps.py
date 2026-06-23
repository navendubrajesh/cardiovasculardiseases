"""Shared FastAPI dependencies: JWT auth, tenant scope, RBAC."""
from __future__ import annotations

import os
from typing import Annotated, Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .auth.jwt import verify_session_token

_bearer = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {
        "org.read", "org.create", "org.update", "org.delete",
        "user.read", "settings:manage",
        "predict.run", "predict.batch", "model.read", "research.read",
    },
    "admin": {
        "org.read", "org.update",
        "user.read", "settings:manage",
        "predict.run", "predict.batch", "model.read", "research.read",
    },
    "researcher": {
        "org.read", "predict.run", "predict.batch", "model.read", "research.read",
    },
    "individual": {
        "org.read", "predict.run", "research.read",
    },
}


class SessionContext:
    def __init__(self, *, sub: str, tenant_id: str, role: str):
        self.sub = sub
        self.tenant_id = tenant_id
        self.role = role

    def has_permission(self, permission: str) -> bool:
        return permission in ROLE_PERMISSIONS.get(self.role, set())


def _dev_bypass() -> bool:
    return os.getenv("DEV_SKIP_AUTH", "false").lower() in ("1", "true", "yes")


async def get_optional_session(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)],
) -> Optional[SessionContext]:
    if not credentials or not credentials.credentials:
        if _dev_bypass():
            return SessionContext(
                sub="dev@local",
                tenant_id=os.getenv("DEV_TENANT_ID", "tenant-dev"),
                role="owner",
            )
        return None
    try:
        payload = verify_session_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session token") from exc
    return SessionContext(
        sub=str(payload.get("sub", "")),
        tenant_id=str(payload.get("tid", "")),
        role=str(payload.get("role", "individual")),
    )


async def require_session(
    session: Annotated[Optional[SessionContext], Depends(get_optional_session)],
) -> SessionContext:
    if session is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not session.tenant_id:
        raise HTTPException(status_code=401, detail="Missing tenant context (tid)")
    return session


def require_permission(permission: str):
    async def _checker(session: Annotated[SessionContext, Depends(require_session)]) -> SessionContext:
        if not session.has_permission(permission):
            raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
        return session

    return _checker


def tenant_filter(session: SessionContext) -> dict:
    return {"tenantId": session.tenant_id}
