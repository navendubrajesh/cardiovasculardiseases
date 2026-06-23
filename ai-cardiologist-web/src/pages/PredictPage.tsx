import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { BRFSS_FIELDS, DEMO_SCENARIOS, buildDefaultFeatures } from '../config/brfssFeatures';
import { canRunPrediction } from '../lib/disclaimer';
import {
  fetchModels,
  normalizeModels,
  runPrediction,
  type ModelInfo,
  type PredictResponse,
} from '../services/predictionsService';
import { Link } from 'react-router-dom';

export const PredictPage = () => {
  const [features, setFeatures] = useState(buildDefaultFeatures());
  const [modelId, setModelId] = useState('ensemble_voting');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [disclaimerAck, setDisclaimerAck] = useState(canRunPrediction());
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchModels();
        const normalized = normalizeModels(data);
        setModels(normalized);
        setModelId(data.defaultModelId || 'ensemble_voting');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load models.');
      } finally {
        setLoadingModels(false);
      }
    })();
  }, []);

  useEffect(() => {
    setDisclaimerAck(canRunPrediction());
  }, []);

  const updateFeature = (name: string, value: number) => {
    setFeatures((prev) => ({ ...prev, [name]: value }));
  };

  const loadScenario = (scenarioId: string) => {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) setFeatures({ ...scenario.features });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!disclaimerAck) {
      setError('Please acknowledge the clinical disclaimer banner before running a prediction.');
      return;
    }

    setLoading(true);
    try {
      const response = await runPrediction({
        modelId,
        features,
        disclaimerAcknowledged: true,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const riskColor =
    result && result.probability >= 0.5
      ? 'border-red-300 bg-red-50 text-red-900'
      : result && result.probability >= 0.3
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : 'border-emerald-300 bg-emerald-50 text-emerald-900';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Single prediction</h1>
        <p className="mt-2 text-slate-600">
          Enter all 21 BRFSS predictors (AC-060). Default model: Ensemble voting (AC-061).
        </p>
      </div>

      {!disclaimerAck && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Acknowledge the site-wide disclaimer banner to enable predictions.{' '}
            <Link to="/governance" className="font-medium underline">
              Read governance policy
            </Link>
          </p>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Demo scenarios (AC-065)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => loadScenario(scenario.id)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRFSS_FIELDS.map((field) => (
            <label key={field.name} className="block text-sm" title={field.tooltip}>
              <span className="font-medium text-slate-700">{field.label}</span>
              {field.type === 'binary' || field.options ? (
                <select
                  value={features[field.name]}
                  onChange={(e) => updateFeature(field.name, Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {(field.options ?? [
                    { value: 0, label: 'No (0)' },
                    { value: 1, label: 'Yes (1)' },
                  ]).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.name === 'BMI' ? 0.1 : 1}
                  value={features[field.name]}
                  onChange={(e) => updateFeature(field.name, Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              )}
              <span className="mt-1 block text-xs text-slate-400">{field.tooltip}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block min-w-[240px] flex-1 text-sm font-medium text-slate-700">
            Model
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={loadingModels}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id} disabled={model.disabled}>
                  {model.label}
                  {model.latencyMs ? ` (~${model.latencyMs}ms)` : ''}
                  {model.disabled ? ` — ${model.disabledReason ?? 'unavailable'}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disclaimerAck}
              onChange={(e) => setDisclaimerAck(e.target.checked)}
              disabled={!canRunPrediction()}
            />
            I acknowledge this is decision-support only (not a diagnosis)
          </label>

          <button
            type="submit"
            disabled={loading || !disclaimerAck}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Run prediction
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {result && (
        <section className={`rounded-2xl border p-6 ${riskColor}`} aria-live="polite">
          <h2 className="text-xl font-bold">Result (AC-062)</h2>
          <p className="mt-2 text-3xl font-bold">P(CVD) = {(result.probability * 100).toFixed(1)}%</p>
          <p className="mt-1">
            Classification: <strong>{result.prediction === 1 ? 'Elevated risk' : 'Lower risk'}</strong> (
            {result.riskLabel})
          </p>
          {result.probability >= 0.5 && (
            <p className="mt-2 text-sm font-medium">
              Recall-oriented warning: elevated probability — consult a qualified clinician for individual assessment.
            </p>
          )}
          {result.explanation?.topContributions?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">Top ELI5 contributors</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {result.explanation.topContributions.slice(0, 5).map((item) => (
                  <li key={item.feature}>
                    {item.feature}: {item.contribution > 0 ? '+' : ''}
                    {item.contribution.toFixed(3)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
