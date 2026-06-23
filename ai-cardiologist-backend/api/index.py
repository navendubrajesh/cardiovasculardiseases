from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db, seed_demo_data
from .routers import auth, organizations, predictions, research


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_data()
    yield


app = FastAPI(title="AI Cardiologist API", lifespan=lifespan)

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5179,http://127.0.0.1:5173,http://127.0.0.1:5179,"
    "https://navendubrajesh.github.io",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(predictions.router)
app.include_router(research.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ai-cardiologist-backend"}
