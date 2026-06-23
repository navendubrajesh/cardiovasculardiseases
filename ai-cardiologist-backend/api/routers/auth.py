from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from ..auth.jwt import sign_session_token
from ..db import get_membership, list_tenants_for_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

AppRole = Literal["owner", "admin", "researcher", "individual"]


class AuthSessionRequest(BaseModel):
    email: EmailStr


class TenantOption(BaseModel):
    tenantId: str
    name: str
    code: str
    role: AppRole


class AuthSessionResponse(BaseModel):
    tenants: list[TenantOption]


class ActiveTenantRequest(BaseModel):
    email: EmailStr
    tenantId: str


class ActiveTenantResponse(BaseModel):
    token: str
    role: AppRole
    tenantId: str
    homePath: str


def role_home_path(role: AppRole) -> str:
    if role in ("owner", "admin"):
        return "/dashboard"
    if role == "researcher":
        return "/predict"
    return "/predict"


@router.post("/session", response_model=AuthSessionResponse)
async def discover_tenants(body: AuthSessionRequest) -> AuthSessionResponse:
    tenants = list_tenants_for_email(body.email)
    if not tenants:
        raise HTTPException(status_code=404, detail="No organization found for this email")
    return AuthSessionResponse(tenants=[TenantOption(**t) for t in tenants])


@router.post("/active-tenant", response_model=ActiveTenantResponse)
async def activate_tenant(body: ActiveTenantRequest) -> ActiveTenantResponse:
    membership = get_membership(body.email, body.tenantId)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    role = membership["role"]
    token = sign_session_token(sub=body.email.lower(), tenant_id=body.tenantId, role=role)
    return ActiveTenantResponse(
        token=token,
        role=role,
        tenantId=body.tenantId,
        homePath=role_home_path(role),
    )
