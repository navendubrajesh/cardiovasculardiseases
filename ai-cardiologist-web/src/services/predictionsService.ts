import { apiJson } from '../lib/apiClient';

export type ModelInfo = {
  id: string;
  label: string;
  latencyMs?: number;
  disabled?: boolean;
  disabledReason?: string;
};

export type ModelsResponse = {
  models: string[] | ModelInfo[];
  defaultModelId: string;
  featureColumns: string[];
};

export type PredictRequest = {
  modelId: string;
  features: Record<string, number>;
  disclaimerAcknowledged: boolean;
};

export type PredictResponse = {
  id: string;
  modelId: string;
  prediction: number;
  probability: number;
  riskLabel: string;
  explanation: {
    probability: number;
    prediction: number;
    topContributions: Array<{ feature: string; contribution: number }>;
  };
};

export type BatchPredictRequest = {
  modelId: string;
  rows: Record<string, number | string>[];
};

export type BatchPredictResponse = {
  tenantId: string;
  modelId: string;
  results: Array<{ prediction: number; probability: number }>;
  metrics: { accuracy: number; roc_auc: number; rows: number } | null;
};

export type PredictionHistoryResponse = {
  predictions: Array<Record<string, unknown>>;
  tenantId: string;
};

const MODEL_LABELS: Record<string, string> = {
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

export function normalizeModels(raw: ModelsResponse): ModelInfo[] {
  const items = raw.models;
  if (items.length === 0) return [];
  if (typeof items[0] === 'string') {
    return (items as string[]).map((id) => ({
      id,
      label: MODEL_LABELS[id] ?? id,
      latencyMs: id === 'ensemble_voting' ? 120 : 80,
      disabled: false,
    }));
  }
  return items as ModelInfo[];
}

export async function fetchModels(): Promise<ModelsResponse> {
  return apiJson<ModelsResponse>('/api/predictions/models');
}

export async function runPrediction(body: PredictRequest): Promise<PredictResponse> {
  return apiJson<PredictResponse>('/api/predictions/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function runBatchPrediction(body: BatchPredictRequest): Promise<BatchPredictResponse> {
  return apiJson<BatchPredictResponse>('/api/predictions/batch', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchPredictionHistory(): Promise<PredictionHistoryResponse> {
  return apiJson<PredictionHistoryResponse>('/api/predictions/history');
}
