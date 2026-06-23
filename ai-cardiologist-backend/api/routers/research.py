from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends

from ..deps import SessionContext, require_permission

router = APIRouter(prefix="/api/research", tags=["research"])

DOCS_DIR = Path(__file__).resolve().parents[2] / ".." / "ai-cardiologist-docs"


@router.get("/references")
async def list_references(
    session: Annotated[SessionContext, Depends(require_permission("research.read"))],
):
    ref_path = DOCS_DIR / "references.json"
    if not ref_path.exists():
        return {"references": [], "tenantId": session.tenant_id}
    data = json.loads(ref_path.read_text(encoding="utf-8"))
    return {"references": data, "tenantId": session.tenant_id}


@router.get("/metrics")
async def model_metrics(
    session: Annotated[SessionContext, Depends(require_permission("model.read"))],
):
    metrics_path = Path(__file__).resolve().parents[2] / ".." / "ai-cardiologist-ml" / "models" / "metrics.json"
    if not metrics_path.exists():
        return {"models": {}, "tenantId": session.tenant_id}
    data = json.loads(metrics_path.read_text(encoding="utf-8"))
    return {**data, "tenantId": session.tenant_id}
