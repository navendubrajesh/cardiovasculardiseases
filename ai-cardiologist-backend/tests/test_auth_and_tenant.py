from fastapi.testclient import TestClient

from api.db import init_db, save_prediction, seed_demo_data
from api.index import app


def test_health():
    client = TestClient(app)
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_auth_session_discovery():
    client = TestClient(app)
    r = client.post("/api/auth/session", json={"email": "researcher@example.com"})
    assert r.status_code == 200
    tenants = r.json()["tenants"]
    assert any(t["tenantId"] == "tenant-dev" for t in tenants)


def test_active_tenant_jwt():
    client = TestClient(app)
    r = client.post(
        "/api/auth/active-tenant",
        json={"email": "researcher@example.com", "tenantId": "tenant-dev"},
    )
    assert r.status_code == 200
    assert "token" in r.json()


def test_social_login_ephemeral():
    client = TestClient(app)
    for provider in ("google", "github", "apple", "linkedin"):
        r = client.post(
            "/api/auth/social",
            json={"provider": provider, "displayName": "Guest User"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["tenantId"] == "guest-demo"
        assert body["role"] == "researcher"
        assert body["homePath"] == "/predict"
        assert body["user"]["provider"] == provider
        assert "token" in body


def test_guest_history_is_ephemeral(monkeypatch):
    monkeypatch.setenv("DEV_SKIP_AUTH", "false")
    client = TestClient(app)
    r = client.post(
        "/api/auth/social",
        json={"provider": "google", "displayName": "Guest User"},
    )
    token = r.json()["token"]
    r = client.get("/api/predictions/history", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["ephemeral"] is True
    assert body["predictions"] == []


def test_tenant_isolation_predictions_history():
    init_db()
    seed_demo_data()
    save_prediction(
        tenant_id="tenant-dev",
        user_email="dev@local",
        model_id="ensemble_voting",
        features={"HighBP": 1},
        prediction=1,
        probability=0.7,
    )
    save_prediction(
        tenant_id="tenant-other",
        user_email="other@example.com",
        model_id="ensemble_voting",
        features={"HighBP": 0},
        prediction=0,
        probability=0.2,
    )
    client = TestClient(app)
    # conftest sets DEV_TENANT_ID=tenant-dev
    r = client.get("/api/predictions/history")
    assert r.status_code == 200
    preds = r.json()["predictions"]
    assert all(p["tenantId"] == "tenant-dev" for p in preds)
    assert len(preds) >= 1
