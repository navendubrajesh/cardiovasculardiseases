import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import {
  BRFSS_FIELDS,
  DEMO_SCENARIOS,
  MIN_PARAMETERS,
  TOTAL_PARAMETERS,
  buildDefaultFeatures,
  topSignificantFeatures,
} from '../config/brfssFeatures';
import { canRunPrediction } from '../lib/disclaimer';
import { generatePredictionReport } from '../lib/reportGenerator';
import {
  fetchModels,
  normalizeModels,
  runMultiPrediction,
  type ModelInfo,
  type PredictResponse,
} from '../services/predictionsService';
import { ModelMultiSelect } from '../components/ModelMultiSelect';
import { useAuth } from '../state/AuthProvider';
import { Link } from 'react-router-dom';

export const PredictPage = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState(buildDefaultFeatures());
  const [paramCount, setParamCount] = useState<number>(TOTAL_PARAMETERS);
  const [selectedModels, setSelectedModels] = useState<string[]>(['ensemble_voting']);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [disclaimerAck, setDisclaimerAck] = useState(canRunPrediction());
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PredictResponse[] | null>(null);
  const [enteredFeatures, setEnteredFeatures] = useState<string[]>([]);

  const enabledSet = useMemo(() => topSignificantFeatures(paramCount), [paramCount]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchModels();
        const normalized = normalizeModels(data);
        setModels(normalized);
        const def = data.defaultModelId || 'ensemble_voting';
        setSelectedModels((prev) => (prev.length ? prev : [def]));
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

  const buildEnabledPayload = (): Record<string, number> => {
    const payload: Record<string, number> = {};
    BRFSS_FIELDS.forEach((field) => {
      if (enabledSet.has(field.name)) payload[field.name] = features[field.name];
    });
    return payload;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResults(null);

    if (!disclaimerAck) {
      setError('Please acknowledge the clinical disclaimer banner before running a prediction.');
      return;
    }
    if (selectedModels.length === 0) {
      setError('Select at least one model.');
      return;
    }

    setLoading(true);
    try {
      const response = await runMultiPrediction({
        modelIds: selectedModels,
        features: buildEnabledPayload(),
        disclaimerAcknowledged: true,
      });
      const sorted = [...response.results].sort((a, b) => b.probability - a.probability);
      setResults(sorted);
      setEnteredFeatures(response.enteredFeatures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results || results.length === 0) return;
    generatePredictionReport({
      paramCount,
      totalParams: TOTAL_PARAMETERS,
      enteredFeatures: enteredFeatures.length ? enteredFeatures : Array.from(enabledSet),
      features,
      selectedModelIds: selectedModels,
      results,
      generatedAt: new Date(),
      userLabel: user ? `${user.name}${user.provider ? ` via ${user.provider}` : ''}` : undefined,
    });
  };

  const riskClass = (p: number) =>
    p >= 0.5
      ? 'border-red-300 bg-red-50 text-red-900'
      : p >= 0.3
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : 'border-emerald-300 bg-emerald-50 text-emerald-900';

  const barColor = (p: number) =>
    p >= 0.5 ? 'bg-red-500' : p >= 0.3 ? 'bg-amber-500' : 'bg-emerald-500';

  const modelLabel = (id: string) => models.find((m) => m.id === id)?.label ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Single prediction</h1>
        <p className="mt-2 text-slate-600">
          Choose how many of the most significant predictors to enter, pick one or more models, and run.
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

      {/* Parameter-count slider */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Number of parameters</h2>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            {paramCount} / {TOTAL_PARAMETERS}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          The top {paramCount} most significant predictors are enabled. The rest are left blank and the
          prediction is based on the entered parameters only.
        </p>
        <input
          type="range"
          min={MIN_PARAMETERS}
          max={TOTAL_PARAMETERS}
          step={1}
          value={paramCount}
          onChange={(e) => setParamCount(Number(e.target.value))}
          className="mt-4 w-full accent-brand-600"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>{MIN_PARAMETERS}</span>
          <span>{TOTAL_PARAMETERS}</span>
        </div>
      </section>

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
          {BRFSS_FIELDS.map((field) => {
            const isEnabled = enabledSet.has(field.name);
            return (
              <label
                key={field.name}
                className={`block text-sm ${isEnabled ? '' : 'opacity-50'}`}
                title={field.tooltip}
              >
                <span className="font-medium text-slate-700">{field.label}</span>
                {!isEnabled ? (
                  <input
                    type="text"
                    value=""
                    disabled
                    placeholder="— not used —"
                    className="mt-1 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-slate-400"
                  />
                ) : field.type === 'binary' || field.options ? (
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
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="min-w-[240px] flex-1">
            <span className="text-sm font-medium text-slate-700">Models (select one or more)</span>
            <ModelMultiSelect
              models={models}
              selected={selectedModels}
              onChange={setSelectedModels}
              disabled={loadingModels}
            />
          </div>

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

          <button
            type="button"
            onClick={handleDownload}
            disabled={!results || results.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-600 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download report
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {results && results.length > 0 && (
        <section className="space-y-6" aria-live="polite">
          <h2 className="text-xl font-bold">
            Results — {results.length} {results.length === 1 ? 'model' : 'models'} (AC-062)
          </h2>

          {/* Comparison chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-700">Risk probability by model</h3>
            <div className="mt-4 space-y-3">
              {results.map((r) => (
                <div key={r.modelId} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-sm text-slate-600">{modelLabel(r.modelId)}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${barColor(r.probability)}`}
                      style={{ width: `${Math.max(2, r.probability * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {(r.probability * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-model cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((r) => (
              <div key={r.modelId} className={`rounded-2xl border p-5 ${riskClass(r.probability)}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{modelLabel(r.modelId)}</h3>
                  <span className="text-2xl font-bold">{(r.probability * 100).toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-sm">
                  {r.prediction === 1 ? 'Elevated risk' : 'Lower risk'} ({r.riskLabel})
                </p>
                {r.explanation?.topContributions?.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Top contributors
                    </h4>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {r.explanation.topContributions.slice(0, 5).map((item) => (
                        <li key={item.feature} className="flex justify-between">
                          <span>{item.feature}</span>
                          <span className="tabular-nums">
                            {item.contribution > 0 ? '+' : ''}
                            {item.contribution.toFixed(3)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Based on {enteredFeatures.length || paramCount} entered parameter(s). Omitted predictors are imputed
            with population-neutral baselines. Use “Download report” for the full settings, predictions, and
            disclaimer.
          </p>
        </section>
      )}
    </div>
  );
};
