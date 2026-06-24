# Deployment Guide

## 1. GitHub Pages (website)

**URL:** https://navendubrajesh.github.io/AICARDIOLOGIST/

### One-time setup (GitHub.com)

1. Open [AICARDIOLOGIST → Settings → Pages](https://github.com/navendubrajesh/AICARDIOLOGIST/settings/pages)
2. **Build and deployment → Source:** select **GitHub Actions**
3. Save

### Deploy

Every push to `main` runs `.github/workflows/deploy-pages.yml`.

Manual trigger: **Actions → Deploy to GitHub Pages → Run workflow**

Optional variable: **Settings → Secrets and variables → Actions → Variables**

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://ai-cardiologist-api.onrender.com` (after API is live) |

---

## 2. Render (API backend)

GitHub Pages is static only — predictions need the FastAPI backend on Render.

**URL (after deploy):** https://ai-cardiologist-api.onrender.com

### One-time setup

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New → Blueprint**
3. Connect GitHub repo `navendubrajesh/AICARDIOLOGIST`
4. Render reads `render.yaml` at repo root
5. Click **Apply** — first deploy trains models (~2–5 min on free tier)

### Verify API

```bash
curl https://ai-cardiologist-api.onrender.com/api/health
```

---

## 3. Full stack test

1. Wait for both GitHub Actions (Pages) and Render to finish
2. Open https://navendubrajesh.github.io/AICARDIOLOGIST/
3. Login: `researcher@example.com` → **Demo Research Lab**
4. Accept disclaimer → **Predict** page

> Free Render sleeps after inactivity — first request may take ~30s to wake up.

---

## 4. Local development

```powershell
# One command (trains models on first run, then starts API + web)
.\scripts\start-local.ps1

# Or manually:
# API
cd ai-cardiologist-backend
$env:MODELS_DIR="..\ai-cardiologist-ml\models\artifacts"
$env:CORS_ORIGINS="http://localhost:5179,http://127.0.0.1:5179"
python -m uvicorn api.index:app --reload --port 8000

# Web (clear production base path for local)
cd ai-cardiologist-web
Remove-Item Env:VITE_BASE_PATH -ErrorAction SilentlyContinue
npm run dev
```

Open **http://localhost:5179** (API auto-targets `http://127.0.0.1:8000`).
