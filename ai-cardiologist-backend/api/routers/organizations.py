from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from ..db import create_organization, list_tenants_for_email
from ..deps import SessionContext, require_permission

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


class CreateOrgRequest(BaseModel):
    name: str
    code: str
    ownerEmail: EmailStr


@router.post("")
async def create_org(
    body: CreateOrgRequest,
    session: Annotated[SessionContext, Depends(require_permission("org.create"))],
):
    org = create_organization(body.name, body.code, body.ownerEmail)
    return org


@router.get("/mine")
async def my_orgs(session: Annotated[SessionContext, Depends(require_permission("org.read"))]):
    tenants = list_tenants_for_email(session.sub)
    return {"tenants": tenants}
