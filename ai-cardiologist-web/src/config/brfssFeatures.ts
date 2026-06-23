export type BrfssFieldType = 'binary' | 'ordinal' | 'numeric';

export type BrfssField = {
  name: string;
  label: string;
  type: BrfssFieldType;
  min?: number;
  max?: number;
  defaultValue: number;
  tooltip: string;
  options?: Array<{ value: number; label: string }>;
};

export const BRFSS_FEATURE_COLUMNS = [
  'HighBP',
  'HighChol',
  'CholCheck',
  'BMI',
  'Smoker',
  'Stroke',
  'Diabetes',
  'PhysActivity',
  'Fruits',
  'Veggies',
  'HvyAlcoholConsump',
  'AnyHealthcare',
  'NoDocbcCost',
  'GenHlth',
  'MentHlth',
  'PhysHlth',
  'DiffWalk',
  'Sex',
  'Age',
  'Education',
  'Income',
] as const;

export const BRFSS_FIELDS: BrfssField[] = [
  { name: 'HighBP', label: 'High Blood Pressure', type: 'binary', defaultValue: 0, tooltip: 'Told has high blood pressure (0/1)' },
  { name: 'HighChol', label: 'High Cholesterol', type: 'binary', defaultValue: 0, tooltip: 'Told has high cholesterol (0/1)' },
  { name: 'CholCheck', label: 'Cholesterol Check', type: 'binary', defaultValue: 1, tooltip: 'Cholesterol checked in past 5 years (0/1)' },
  { name: 'BMI', label: 'BMI', type: 'numeric', min: 12, max: 98, defaultValue: 27, tooltip: 'Body mass index (12–98)' },
  { name: 'Smoker', label: 'Smoker', type: 'binary', defaultValue: 0, tooltip: 'Smoked 100+ cigarettes lifetime (0/1)' },
  { name: 'Stroke', label: 'Stroke History', type: 'binary', defaultValue: 0, tooltip: 'Ever told had stroke (0/1)' },
  {
    name: 'Diabetes',
    label: 'Diabetes',
    type: 'ordinal',
    defaultValue: 0,
    min: 0,
    max: 2,
    tooltip: 'Diabetes status (0=No, 1=Prediabetes, 2=Yes)',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Prediabetes' },
      { value: 2, label: 'Yes' },
    ],
  },
  { name: 'PhysActivity', label: 'Physical Activity', type: 'binary', defaultValue: 1, tooltip: 'Physical activity past 30 days (0/1)' },
  { name: 'Fruits', label: 'Daily Fruit', type: 'binary', defaultValue: 1, tooltip: 'Fruit ≥1/day (0/1)' },
  { name: 'Veggies', label: 'Daily Vegetables', type: 'binary', defaultValue: 1, tooltip: 'Vegetables ≥1/day (0/1)' },
  { name: 'HvyAlcoholConsump', label: 'Heavy Alcohol', type: 'binary', defaultValue: 0, tooltip: 'Heavy alcohol consumption (0/1)' },
  { name: 'AnyHealthcare', label: 'Health Coverage', type: 'binary', defaultValue: 1, tooltip: 'Has health care coverage (0/1)' },
  { name: 'NoDocbcCost', label: 'Cost Barrier', type: 'binary', defaultValue: 0, tooltip: 'Could not see doctor due to cost (0/1)' },
  {
    name: 'GenHlth',
    label: 'General Health',
    type: 'ordinal',
    defaultValue: 3,
    min: 1,
    max: 5,
    tooltip: 'General health 1=Excellent … 5=Poor',
    options: [
      { value: 1, label: 'Excellent' },
      { value: 2, label: 'Very Good' },
      { value: 3, label: 'Good' },
      { value: 4, label: 'Fair' },
      { value: 5, label: 'Poor' },
    ],
  },
  { name: 'MentHlth', label: 'Mental Health Days', type: 'numeric', min: 0, max: 30, defaultValue: 0, tooltip: 'Mental health not good days (0–30)' },
  { name: 'PhysHlth', label: 'Physical Health Days', type: 'numeric', min: 0, max: 30, defaultValue: 0, tooltip: 'Physical health not good days (0–30)' },
  { name: 'DiffWalk', label: 'Difficulty Walking', type: 'binary', defaultValue: 0, tooltip: 'Serious difficulty walking/climbing (0/1)' },
  {
    name: 'Sex',
    label: 'Sex',
    type: 'binary',
    defaultValue: 0,
    tooltip: '0=Female, 1=Male',
    options: [
      { value: 0, label: 'Female' },
      { value: 1, label: 'Male' },
    ],
  },
  {
    name: 'Age',
    label: 'Age Category',
    type: 'ordinal',
    defaultValue: 8,
    min: 1,
    max: 13,
    tooltip: 'BRFSS 5-year age group',
    options: [
      { value: 1, label: '18–24' },
      { value: 2, label: '25–29' },
      { value: 3, label: '30–34' },
      { value: 4, label: '35–39' },
      { value: 5, label: '40–44' },
      { value: 6, label: '45–49' },
      { value: 7, label: '50–54' },
      { value: 8, label: '55–59' },
      { value: 9, label: '60–64' },
      { value: 10, label: '65–69' },
      { value: 11, label: '70–74' },
      { value: 12, label: '75–79' },
      { value: 13, label: '80 or older' },
    ],
  },
  {
    name: 'Education',
    label: 'Education',
    type: 'ordinal',
    defaultValue: 4,
    min: 1,
    max: 6,
    tooltip: 'Highest education level completed',
    options: [
      { value: 1, label: 'Never attended / kindergarten only' },
      { value: 2, label: 'Elementary (Grades 1–8)' },
      { value: 3, label: 'Some high school (Grades 9–11)' },
      { value: 4, label: 'High school graduate / GED' },
      { value: 5, label: 'Some college / technical school' },
      { value: 6, label: 'College graduate (4+ years)' },
    ],
  },
  {
    name: 'Income',
    label: 'Income Band',
    type: 'ordinal',
    defaultValue: 5,
    min: 1,
    max: 8,
    tooltip: 'Annual household income band',
    options: [
      { value: 1, label: 'Less than $10,000' },
      { value: 2, label: '$10,000 – $14,999' },
      { value: 3, label: '$15,000 – $19,999' },
      { value: 4, label: '$20,000 – $24,999' },
      { value: 5, label: '$25,000 – $34,999' },
      { value: 6, label: '$35,000 – $49,999' },
      { value: 7, label: '$50,000 – $74,999' },
      { value: 8, label: '$75,000 or more' },
    ],
  },
];

export const DEFAULT_FEATURES = Object.fromEntries(
  BRFSS_FIELDS.map((field) => [field.name, field.defaultValue]),
) as Record<string, number>;

/**
 * Predictors ordered from most to least significant for CVD risk
 * (derived from ensemble feature-importance ranking, thesis §5.3).
 * Drives the "parameter count" slider: selecting N enables the top-N here.
 */
export const BRFSS_SIGNIFICANCE_ORDER = [
  'GenHlth',
  'Age',
  'HighBP',
  'BMI',
  'HighChol',
  'DiffWalk',
  'Diabetes',
  'Stroke',
  'PhysHlth',
  'Smoker',
  'Income',
  'Sex',
  'Education',
  'PhysActivity',
  'HvyAlcoholConsump',
  'MentHlth',
  'CholCheck',
  'NoDocbcCost',
  'Veggies',
  'Fruits',
  'AnyHealthcare',
] as const;

export const TOTAL_PARAMETERS = BRFSS_SIGNIFICANCE_ORDER.length;
export const MIN_PARAMETERS = 10;

/** Names of the top-N most significant predictors. */
export function topSignificantFeatures(count: number): Set<string> {
  const n = Math.max(MIN_PARAMETERS, Math.min(TOTAL_PARAMETERS, count));
  return new Set(BRFSS_SIGNIFICANCE_ORDER.slice(0, n));
}

export const MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic Regression',
  svm: 'Support Vector Machine',
  decision_tree: 'Decision Tree',
  knn: 'k-Nearest Neighbors',
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
  neural_network: 'Neural Network',
  naive_bayes: 'Naive Bayes',
  ensemble_voting: 'Ensemble (Voting)',
  anfis: 'ANFIS / Fuzzy',
};

/** Thesis §5.4.2 demo scenarios (AC-065). */
export const DEMO_SCENARIOS = [
  {
    id: 'case-1',
    label: 'Case 1 — Moderate risk (~0.628)',
    expectedProbability: 0.628,
    features: {
      HighBP: 1, HighChol: 1, CholCheck: 1, BMI: 31, Smoker: 1, Stroke: 0, Diabetes: 0,
      PhysActivity: 0, Fruits: 0, Veggies: 1, HvyAlcoholConsump: 0, AnyHealthcare: 1,
      NoDocbcCost: 0, GenHlth: 4, MentHlth: 5, PhysHlth: 10, DiffWalk: 0, Sex: 1, Age: 10,
      Education: 4, Income: 4,
    },
  },
  {
    id: 'case-2',
    label: 'Case 2 — Elevated risk (~0.832)',
    expectedProbability: 0.832,
    features: {
      HighBP: 1, HighChol: 1, CholCheck: 1, BMI: 35, Smoker: 1, Stroke: 1, Diabetes: 2,
      PhysActivity: 0, Fruits: 0, Veggies: 0, HvyAlcoholConsump: 1, AnyHealthcare: 1,
      NoDocbcCost: 1, GenHlth: 5, MentHlth: 15, PhysHlth: 20, DiffWalk: 1, Sex: 1, Age: 12,
      Education: 3, Income: 3,
    },
  },
  {
    id: 'case-3',
    label: 'Case 3 — Intermediate risk (~0.693)',
    expectedProbability: 0.693,
    features: {
      HighBP: 1, HighChol: 0, CholCheck: 1, BMI: 28, Smoker: 0, Stroke: 0, Diabetes: 1,
      PhysActivity: 1, Fruits: 1, Veggies: 1, HvyAlcoholConsump: 0, AnyHealthcare: 1,
      NoDocbcCost: 0, GenHlth: 3, MentHlth: 2, PhysHlth: 5, DiffWalk: 0, Sex: 0, Age: 9,
      Education: 5, Income: 6,
    },
  },
] as const;

export function buildDefaultFeatures(): Record<string, number> {
  return { ...DEFAULT_FEATURES };
}
