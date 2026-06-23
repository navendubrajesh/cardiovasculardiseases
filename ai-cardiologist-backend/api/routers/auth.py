from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from ..auth.jwt import sign_session_token
from ..db import get_membership, list_tenants_for_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

GUEST_TENANT_ID = "guest-demo"

AppRole = Literal["owner", "admin", "researcher", "individual"]
SocialProvider = Literal["google", "github", "apple", "linkedin"]


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


class SocialLoginRequest(BaseModel):
    provider: SocialProvider
    displayName: str = Field(min_length=1, max_length=120)


class SocialUserProfile(BaseModel):
    displayName: str
    email: str
    provider: SocialProvider


class SocialLoginResponse(BaseModel):
    token: str
    role: AppRole
    tenantId: str
    homePath: str
    user: SocialUserProfile


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


@router.post("/social", response_model=SocialLoginResponse)
async def social_login(body: SocialLoginRequest) -> SocialLoginResponse:
    """Ephemeral guest JWT — no membership or user rows are written."""
    email = f"guest-{body.provider}@aicardiologist.local"
    role: AppRole = "researcher"
    token = sign_session_token(sub=email, tenant_id=GUEST_TENANT_ID, role=role)
    return SocialLoginResponse(
        token=token,
        role=role,
        tenantId=GUEST_TENANT_ID,
        homePath="/predict",
        user=SocialUserProfile(
            displayName=body.displayName,
            email=email,
            provider=body.provider,
        ),
    )
