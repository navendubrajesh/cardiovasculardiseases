from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import list_predictions, save_prediction
from ..deps import SessionContext, require_permission
from ..routers.auth import GUEST_TENANT_ID
from ..ml_service import DEFAULT_MODEL_ID, FEATURE_COLUMNS, list_available_models, predict_batch, predict_single

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


class PredictRequest(BaseModel):
    modelId: str = DEFAULT_MODEL_ID
    features: dict[str, Any]
    disclaimerAcknowledged: bool = False


class PredictResponse(BaseModel):
    id: str
    modelId: str
    prediction: int
    probability: float
    riskLabel: str
    explanation: dict
    enteredFeatures: list[str] = Field(default_factory=list)


class MultiPredictRequest(BaseModel):
    modelIds: list[str] = Field(..., min_length=1, max_length=20)
    features: dict[str, Any]
    disclaimerAcknowledged: bool = False


class MultiPredictResponse(BaseModel):
    results: list[PredictResponse]
    enteredFeatures: list[str]


class BatchPredictRequest(BaseModel):
    modelId: str = DEFAULT_MODEL_ID
    rows: list[dict[str, Any]] = Field(..., min_length=1, max_length=5000)


@router.get("/models")
async def get_models(
    session: Annotated[SessionContext, Depends(require_permission("model.read"))],
):
    models = list_available_models()
    return {"models": models, "defaultModelId": DEFAULT_MODEL_ID, "featureColumns": FEATURE_COLUMNS}


@router.post("/run", response_model=PredictResponse)
async def run_prediction(
    body: PredictRequest,
    session: Annotated[SessionContext, Depends(require_permission("predict.run"))],
):
    if not body.disclaimerAcknowledged:
        raise HTTPException(status_code=400, detail="Clinical disclaimer must be acknowledged")
    result = predict_single(body.modelId, body.features)
    pred_id = "ephemeral"
    if session.tenant_id != GUEST_TENANT_ID:
        pred_id = save_prediction(
            tenant_id=session.tenant_id,
            user_email=session.sub,
            model_id=body.modelId,
            features=body.features,
            prediction=result["prediction"],
            probability=result["probability"],
            explanation=result.get("explanation"),
        )
    return PredictResponse(id=pred_id, **result)


@router.post("/run-multi", response_model=MultiPredictResponse)
async def run_multi_prediction(
    body: MultiPredictRequest,
    session: Annotated[SessionContext, Depends(require_permission("predict.run"))],
):
    if not body.disclaimerAcknowledged:
        raise HTTPException(status_code=400, detail="Clinical disclaimer must be acknowledged")
    results: list[PredictResponse] = []
    entered: list[str] = []
    persist = session.tenant_id != GUEST_TENANT_ID
    for model_id in body.modelIds:
        result = predict_single(model_id, body.features)
        entered = result.get("enteredFeatures", [])
        pred_id = "ephemeral"
        if persist:
            pred_id = save_prediction(
                tenant_id=session.tenant_id,
                user_email=session.sub,
                model_id=model_id,
                features=body.features,
                prediction=result["prediction"],
                probability=result["probability"],
                explanation=result.get("explanation"),
            )
        results.append(PredictResponse(id=pred_id, **result))
    return MultiPredictResponse(results=results, enteredFeatures=entered)


@router.post("/batch")
async def run_batch(
    body: BatchPredictRequest,
    session: Annotated[SessionContext, Depends(require_permission("predict.batch"))],
):
    result = predict_batch(body.modelId, body.rows)
    return {"tenantId": session.tenant_id, **result}


@router.get("/history")
async def prediction_history(
    session: Annotated[SessionContext, Depends(require_permission("predict.run"))],
):
    if session.tenant_id == GUEST_TENANT_ID:
        return {"predictions": [], "tenantId": session.tenant_id, "ephemeral": True}
    rows = list_predictions(session.tenant_id)
    return {"predictions": rows, "tenantId": session.tenant_id}
