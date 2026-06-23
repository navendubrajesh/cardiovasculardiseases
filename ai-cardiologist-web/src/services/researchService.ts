import { apiJson } from '../lib/apiClient';

export type ReferenceEntry = {
  id?: string;
  refId?: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  topics?: string[];
};

export type ReferencesResponse = {
  references: ReferenceEntry[];
  tenantId: string;
};

export type ModelMetrics = {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  roc_auc?: number;
  train_accuracy?: number;
  test_accuracy?: number;
  latency_ms?: number;
  label?: string;
};

export type MetricsResponse = {
  models: Record<string, ModelMetrics>;
  defaultModelId?: string;
  tenantId: string;
};

export async function fetchReferences(): Promise<ReferencesResponse> {
  return apiJson<ReferencesResponse>('/api/research/references');
}

export async function fetchModelMetrics(): Promise<MetricsResponse> {
  return apiJson<MetricsResponse>('/api/research/metrics');
}
