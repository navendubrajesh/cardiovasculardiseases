# AI Cardiologist — ML Engine & Training Pipeline

Reproducible BRFSS cardiovascular disease (CVD) classification pipeline from the
[MS Navendu Brajesh V1.2](../AI%20Cardiologist.Doc/MS%20Navendu%20Brajesh%20V1.2.pdf) thesis.

## Models (AC-020–AC-028)

| ID | Algorithm |
|----|-----------|
| `logistic_regression` | Logistic Regression (explainability baseline) |
| `svm` | Support Vector Machine |
| `decision_tree` | Decision Tree |
| `knn` | k-Nearest Neighbors |
| `random_forest` | Random Forest |
| `xgboost` | XGBoost |
| `neural_network` | MLP Neural Network |
| `naive_bayes` | Gaussian Naive Bayes |
| `ensemble_voting` | Soft Voting Ensemble (**default**, journal 89.1% target) |
| `anfis` | Fuzzy/ANFIS proxy (MLP tanh — full ANFIS requires MATLAB/sklearn-fuzzy) |

## Dataset (AC-010)

Place `heart_disease_health_indicators_BRFSS2015.csv` in `data/` (253,680 rows, 21 features + target).

Download: [Kaggle BRFSS 2015 Heart Disease](https://www.kaggle.com/datasets/amerkel/brfss2015) or CDC archive.

Without the CSV, training uses an 8,000-row synthetic BRFSS-like dataset for CI.

## Quick start

```bash
pip install -r requirements.txt
pip install -e .
python scripts/train.py train --out models
pytest
```

Outputs:

- `models/metrics.json` — leaderboard (AC-030)
- `models/artifacts/*.joblib` — exported pipelines (AC-035)
- `models/global_importance.json` — ELI5 global weights (AC-040)

## Feature dictionary

See [DATA_MODEL.md](../ai-cardiologist-docs/DATA_MODEL.md) or `src/aicardio/constants.py`.
