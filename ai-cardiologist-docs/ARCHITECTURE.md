# Architecture (AC-071)

## Three repositories

```
AI Cardiologist/
├── ai-cardiologist-ml/        # Training pipeline, model export
├── ai-cardiologist-backend/   # FastAPI multi-tenant API
├── ai-cardiologist-web/       # React SPA (GitHub Pages)
└── ai-cardiologist-docs/      # Research hub assets
```

## Auth & multi-tenancy

Pattern from FrenchCoachPro:

1. `POST /api/auth/session` — email → tenant list
2. `POST /api/auth/active-tenant` — JWT with `sub`, `tid`, `role`
3. All reads/writes filtered by `tenantId`

### Roles & permissions

| Role | Key permissions |
|------|-----------------|
| owner | org.*, predict.*, model.read, research.read |
| admin | org.read/update, predict.*, model.read |
| researcher | predict.run/batch, model.read, research.read |
| individual | predict.run, research.read |

## Inference path

```
Web form → POST /api/predictions/run → ml_service.load_model(joblib)
         → SQLite audit log (tenant-scoped)
```

## Deployment

- **Web**: GitHub Actions → GitHub Pages (`/.github/workflows/deploy-pages.yml`)
- **API**: Render/Railway/Fly.io with `MODELS_DIR` pointing to ML artifacts
- **ML CI**: `workflow_dispatch` retrain job (AC-081)

## Client-side inference (AC-082)

GitHub Pages is static; primary inference uses backend API. Optional Pyodide POC documented for offline demos.
