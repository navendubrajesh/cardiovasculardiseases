import { useEffect, useMemo, useState } from 'react';
import { wakeApi } from '../services/authService';
import { fetchModelMetrics, type ModelMetrics } from '../services/researchService';

const METRIC_KEYS: Array<{ key: keyof ModelMetrics; label: string; format: (v: number) => string }> = [
  { key: 'test_accuracy', label: 'Test Accuracy', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'accuracy', label: 'Accuracy', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'f1', label: 'F1 Score', format: (v) => v.toFixed(3) },
  { key: 'roc_auc', label: 'ROC-AUC', format: (v) => v.toFixed(3) },
  { key: 'recall', label: 'Recall', format: (v) => v.toFixed(3) },
];

const MODEL_LABELS: Record<string, string> = {
  logistic_regression: 'Logistic Regression',
  svm: 'SVM',
  decision_tree: 'Decision Tree',
  knn: 'k-NN',
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
  neural_network: 'Neural Network',
  naive_bayes: 'Naive Bayes',
  ensemble_voting: 'Ensemble Voting',
  anfis: 'ANFIS',
};

function MetricBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${width}%` }} />
    </div>
  );
}

export const ModelsPage = () => {
  const [metrics, setMetrics] = useState<Record<string, ModelMetrics>>({});
  const [metricKey, setMetricKey] = useState<keyof ModelMetrics>('test_accuracy');
  const [showTrain, setShowTrain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await wakeApi(3);
        const data = await fetchModelMetrics();
        setMetrics(data.models ?? {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load metrics.';
        setError(
          msg.includes('fetch')
            ? 'Could not reach the API. Wait ~30s for the server to wake up and refresh.'
            : msg,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    const key = showTrain ? 'train_accuracy' : metricKey;
    return Object.entries(metrics)
      .map(([id, m]) => ({
        id,
        label: m.label ?? MODEL_LABELS[id] ?? id,
        value: Number(m[key] ?? m.accuracy ?? 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [metrics, metricKey, showTrain]);

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 1;
  const selectedMetric = METRIC_KEYS.find((m) => m.key === metricKey) ?? METRIC_KEYS[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Model leaderboard</h1>
        <p className="mt-2 text-slate-600">
          Interactive charts from <code>/api/research/metrics</code> mirroring thesis §5.3 (AC-064).
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="text-sm font-medium text-slate-700">
          Metric
          <select
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value as keyof ModelMetrics)}
            disabled={showTrain}
            className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
          >
            {METRIC_KEYS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showTrain} onChange={(e) => setShowTrain(e.target.checked)} />
          Show train accuracy
        </label>
      </div>

      {loading && <p className="text-slate-500">Loading metrics…</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!loading && chartData.length === 0 && !error && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No metrics available yet. Run ML training to generate <code>metrics.json</code>.
        </p>
      )}

      {chartData.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">
            {showTrain ? 'Train accuracy' : selectedMetric.label} by model
          </h2>
          <ul className="space-y-4">
            {chartData.map((item) => (
              <li key={item.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span>{selectedMetric.format(item.value)}</span>
                </div>
                <MetricBar value={item.value} max={maxValue} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {chartData.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">F1</th>
                <th className="px-4 py-3">ROC-AUC</th>
                <th className="px-4 py-3">Recall</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics).map(([id, m]) => (
                <tr key={id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{m.label ?? MODEL_LABELS[id] ?? id}</td>
                  <td className="px-4 py-2">{m.test_accuracy ?? m.accuracy ? `${((m.test_accuracy ?? m.accuracy ?? 0) * 100).toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-2">{m.f1?.toFixed(3) ?? '—'}</td>
                  <td className="px-4 py-2">{m.roc_auc?.toFixed(3) ?? '—'}</td>
                  <td className="px-4 py-2">{m.recall?.toFixed(3) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
