"""SQLite persistence with mandatory tenantId on tenant-scoped tables."""
from __future__ import annotations

import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


def _db_path() -> Path:
    return Path(os.getenv("AI_CARDIO_DB", "data/aicardio.db"))


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_conn():
    db_path = _db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS memberships (
                id TEXT PRIMARY KEY,
                tenantId TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                UNIQUE(tenantId, email)
            );
            CREATE TABLE IF NOT EXISTS predictions (
                id TEXT PRIMARY KEY,
                tenantId TEXT NOT NULL,
                userEmail TEXT NOT NULL,
                modelId TEXT NOT NULL,
                featuresJson TEXT NOT NULL,
                prediction INTEGER NOT NULL,
                probability REAL NOT NULL,
                explanationJson TEXT,
                createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS batch_jobs (
                id TEXT PRIMARY KEY,
                tenantId TEXT NOT NULL,
                userEmail TEXT NOT NULL,
                modelId TEXT NOT NULL,
                rowCount INTEGER NOT NULL,
                metricsJson TEXT,
                createdAt TEXT NOT NULL
            );
            """
        )


def seed_demo_data() -> None:
    with get_conn() as conn:
        existing = conn.execute("SELECT COUNT(*) AS c FROM organizations").fetchone()["c"]
        if existing:
            return
        org_id = "tenant-dev"
        conn.execute(
            "INSERT INTO organizations (id, name, code, createdAt) VALUES (?, ?, ?, ?)",
            (org_id, "Demo Research Lab", "demo-lab", _utcnow()),
        )
        conn.execute(
            "INSERT INTO memberships (id, tenantId, email, role, createdAt) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), org_id, "researcher@example.com", "researcher", _utcnow()),
        )
        conn.execute(
            "INSERT INTO memberships (id, tenantId, email, role, createdAt) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), org_id, "dev@local", "owner", _utcnow()),
        )
        # Second tenant for isolation tests
        org2 = "tenant-other"
        conn.execute(
            "INSERT INTO organizations (id, name, code, createdAt) VALUES (?, ?, ?, ?)",
            (org2, "Other Lab", "other-lab", _utcnow()),
        )
        conn.execute(
            "INSERT INTO memberships (id, tenantId, email, role, createdAt) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), org2, "other@example.com", "researcher", _utcnow()),
        )


def list_tenants_for_email(email: str) -> list[dict[str, Any]]:
    email = email.lower().strip()
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT m.tenantId, o.name, o.code, m.role
            FROM memberships m
            JOIN organizations o ON o.id = m.tenantId
            WHERE lower(m.email) = ?
            """,
            (email,),
        ).fetchall()
    return [
        {"tenantId": r["tenantId"], "name": r["name"], "code": r["code"], "role": r["role"]}
        for r in rows
    ]


def get_membership(email: str, tenant_id: str) -> Optional[dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM memberships WHERE lower(email) = ? AND tenantId = ?",
            (email.lower(), tenant_id),
        ).fetchone()
    return dict(row) if row else None


def create_organization(name: str, code: str, owner_email: str) -> dict[str, Any]:
    org_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO organizations (id, name, code, createdAt) VALUES (?, ?, ?, ?)",
            (org_id, name, code, _utcnow()),
        )
        conn.execute(
            "INSERT INTO memberships (id, tenantId, email, role, createdAt) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), org_id, owner_email.lower(), "owner", _utcnow()),
        )
    return {"id": org_id, "name": name, "code": code}


def save_prediction(
    *,
    tenant_id: str,
    user_email: str,
    model_id: str,
    features: dict,
    prediction: int,
    probability: float,
    explanation: Optional[dict] = None,
) -> str:
    pred_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO predictions
            (id, tenantId, userEmail, modelId, featuresJson, prediction, probability, explanationJson, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pred_id,
                tenant_id,
                user_email,
                model_id,
                json.dumps(features),
                prediction,
                probability,
                json.dumps(explanation) if explanation else None,
                _utcnow(),
            ),
        )
    return pred_id


def list_predictions(tenant_id: str, limit: int = 50) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE tenantId = ? ORDER BY createdAt DESC LIMIT ?",
            (tenant_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]
