# Data Model — BRFSS 2015 (AC-071)

## Target

| Column | Definition |
|--------|------------|
| `HeartDiseaseorAttack` | Self-reported CHD or myocardial infarction (0=No, 1=Yes) |

Journal extension (2024 LLCP): `_MICHD` from `CVDCRHD4` + `CVDINFR4`.

## Predictors (21 features)

See `../ai-cardiologist-ml/src/aicardio/constants.py` for machine-readable schema.

| Feature | Description |
|---------|-------------|
| HighBP | Told has high blood pressure |
| HighChol | Told has high cholesterol |
| CholCheck | Cholesterol checked in past 5 years |
| BMI | Body mass index |
| Smoker | Smoked 100+ cigarettes lifetime |
| Stroke | Ever told had stroke |
| Diabetes | Diabetes status (0/1/2) |
| PhysActivity | Physical activity past 30 days |
| Fruits | Fruit ≥1/day |
| Veggies | Vegetables ≥1/day |
| HvyAlcoholConsump | Heavy alcohol consumption |
| AnyHealthcare | Has health care coverage |
| NoDocbcCost | Could not see doctor due to cost |
| GenHlth | General health 1–5 |
| MentHlth | Mental health not good days (0–30) |
| PhysHlth | Physical health not good days (0–30) |
| DiffWalk | Serious difficulty walking |
| Sex | 0=Female, 1=Male |
| Age | Age category 1–14 |
| Education | Education level 1–6 |
| Income | Income band 1–8 |

## Dataset statistics (thesis)

- Rows: 253,680
- Missing cells: 0
- Positive prevalence: ~9.3%

## Multi-tenant entities (platform)

| Entity | Tenant key | Notes |
|--------|------------|-------|
| Organization | `id` | Research lab / individual workspace |
| Membership | `tenantId` | email + role |
| Prediction | `tenantId` | Audit log of inference runs |
| BatchJob | `tenantId` | CSV batch metadata |
