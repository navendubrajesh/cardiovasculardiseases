"""BRFSS 2015 feature schema — thesis Table 2 (MS Navendu Brajesh V1.2)."""

TARGET_COLUMN = "HeartDiseaseorAttack"

FEATURE_COLUMNS = [
    "HighBP",
    "HighChol",
    "CholCheck",
    "BMI",
    "Smoker",
    "Stroke",
    "Diabetes",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "GenHlth",
    "MentHlth",
    "PhysHlth",
    "DiffWalk",
    "Sex",
    "Age",
    "Education",
    "Income",
]

ALL_COLUMNS = FEATURE_COLUMNS + [TARGET_COLUMN]

# Features requiring scaling (thesis §4.3)
SCALE_COLUMNS = {"BMI", "MentHlth", "PhysHlth"}

MODEL_IDS = [
    "logistic_regression",
    "svm",
    "decision_tree",
    "knn",
    "random_forest",
    "xgboost",
    "neural_network",
    "naive_bayes",
    "ensemble_voting",
    "anfis",
]

DEFAULT_MODEL_ID = "ensemble_voting"

FEATURE_DEFINITIONS = {
    "HeartDiseaseorAttack": "Ever reported CHD or myocardial infarction (0=No, 1=Yes)",
    "HighBP": "Told has high blood pressure (0/1)",
    "HighChol": "Told has high cholesterol (0/1)",
    "CholCheck": "Cholesterol checked in past 5 years (0/1)",
    "BMI": "Body mass index (12–98)",
    "Smoker": "Smoked 100+ cigarettes lifetime (0/1)",
    "Stroke": "Ever told had stroke (0/1)",
    "Diabetes": "Diabetes status (0/1/2)",
    "PhysActivity": "Physical activity past 30 days (0/1)",
    "Fruits": "Fruit ≥1/day (0/1)",
    "Veggies": "Vegetables ≥1/day (0/1)",
    "HvyAlcoholConsump": "Heavy alcohol consumption (0/1)",
    "AnyHealthcare": "Has health care coverage (0/1)",
    "NoDocbcCost": "Could not see doctor due to cost (0/1)",
    "GenHlth": "General health 1=Excellent … 5=Poor",
    "MentHlth": "Mental health not good days (0–30)",
    "PhysHlth": "Physical health not good days (0–30)",
    "DiffWalk": "Serious difficulty walking/climbing (0/1)",
    "Sex": "0=Female, 1=Male",
    "Age": "Age category 1–14 (18–80+)",
    "Education": "Education level 1–6",
    "Income": "Household income band 1–8",
}
