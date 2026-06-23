# Methodology (AC-071)

Aligned with MS Navendu Brajesh V1.2 and journal draft §IV.

## Data

1. Primary: BRFSS 2015 cleaned CSV (`heart_disease_health_indicators_BRFSS2015.csv`)
2. Extension: BRFSS 2024 LLCP with survey weight `_LLCPWT` (AC-011)

## Preprocessing (AC-012)

- Stratified 70/30 train/test split (`random_state=42`)
- Median imputation (continuous), mode (categorical)
- StandardScaler on BMI, MentHlth, PhysHlth
- **All transforms fit on train fold only** (sklearn Pipeline)

## Models (AC-020–AC-028)

SVM, Decision Tree, KNN, MLP, Random Forest, XGBoost, Naive Bayes, Logistic Regression, Ensemble Voting, ANFIS proxy.

## Evaluation (AC-030, AC-031)

Metrics: accuracy, precision, recall, F1, ROC-AUC, Brier score, calibration curve.

Validation: 5-fold stratified CV with bootstrap CI on AUROC.

## Explainability (AC-040, AC-041)

- **ELI5** global feature weights
- Local instance contributions per prediction
- Optional **SHAP** for tree ensembles (AC-042)

## Clinical framing

Decision-support / population screening — **not** standalone diagnosis.
