# AI Cardiologist — Cardiovascular Disease Prediction Platform

Research implementation of **AI Cardiologist**: explainable ML for CVD risk from BRFSS survey data  
(MS Navendu Brajesh V1.2 thesis — ensemble + ELI5).

**Repository:** [github.com/navendubrajesh/cardiovasculardiseases](https://github.com/navendubrajesh/cardiovasculardiseases)  
**Live site (after Pages deploy):** `https://navendubrajesh.github.io/cardiovasculardiseases/`

---

## Repository layout

| Folder | Description |
|--------|-------------|
| [`CVD_*.ipynb`](.) | Original Jupyter experiments (SVM, DT, KNN, NN, RF, Ensemble, ANFIS) |
| [`ai-cardiologist-ml/`](ai-cardiologist-ml/) | Production training pipeline — all classifiers, export, tests |
| [`ai-cardiologist-backend/`](ai-cardiologist-backend/) | Multi-tenant FastAPI — auth, RBAC, predictions |
| [`ai-cardiologist-web/`](ai-cardiologist-web/) | React SPA — predict, batch CSV, model dashboard |
| [`ai-cardiologist-docs/`](ai-cardiologist-docs/) | Methodology, architecture, bibliography |
| [`AI Cardiologist.Doc/`](AI%20Cardiologist.Doc/) | Requirements, references (PDFs kept locally) |

---

## Quick start

```powershell
# Train models
cd ai-cardiologist-ml
pip install -r requirements.txt
$env:PYTHONPATH="src"
python scripts/train.py train --out models

# API
cd ..\ai-cardiologist-backend
pip install -r requirements.txt
$env:MODELS_DIR="..\ai-cardiologist-ml\models\artifacts"
uvicorn api.index:app --reload --port 8000

# Web
cd ..\ai-cardiologist-web
npm install
npm run dev
```

Demo login: `researcher@example.com` → **Demo Research Lab**

---

## GitHub Pages

1. **Settings → Pages → Build:** GitHub Actions  
2. Set repo variable `VITE_API_BASE_URL` to your deployed API  
3. Push to `main` — workflow deploys `ai-cardiologist-web`

---

## Citation

Navendu Brajesh. *Approach for an AI Cardiologist with focus on cardiovascular disease prediction and explainability (using ELI5).* Liverpool John Moores University, 2022.

**Not a medical device** — decision-support / research use only.
