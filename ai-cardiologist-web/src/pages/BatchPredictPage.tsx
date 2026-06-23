import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Download, Loader2, Upload } from 'lucide-react';
import { BRFSS_FEATURE_COLUMNS } from '../config/brfssFeatures';
import {
  fetchModels,
  normalizeModels,
  runBatchPrediction,
  type BatchPredictResponse,
  type ModelInfo,
} from '../services/predictionsService';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i]?.trim() ?? '';
    });
    return row;
  });
}

function rowsToNumeric(rows: Record<string, string>[]): Record<string, number>[] {
  return rows.map((row) => {
    const numeric: Record<string, number> = {};
    for (const col of BRFSS_FEATURE_COLUMNS) {
      numeric[col] = Number(row[col]);
    }
    return numeric;
  });
}

function downloadCsv(filename: string, headers: string[], data: string[][]) {
  const content = [headers.join(','), ...data.map((r) => r.join(','))].join('\n');
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const BatchPredictPage = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [modelId, setModelId] = useState('ensemble_voting');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchPredictResponse | null>(null);

  useEffect(() => {
    void fetchModels().then((data) => {
      setModels(normalizeModels(data));
      setModelId(data.defaultModelId || 'ensemble_voting');
    });
  }, []);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      return;
    }
    setError(null);
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    setParsedRows(rows);
    setRowCount(rows.length);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      setError('Upload a CSV with BRFSS feature columns first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const numericRows = rowsToNumeric(parsedRows);
      const response = await runBatchPrediction({ modelId, rows: numericRows });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const headers = [...BRFSS_FEATURE_COLUMNS, 'prediction', 'probability'];
    const data = parsedRows.map((row, i) => [
      ...BRFSS_FEATURE_COLUMNS.map((col) => row[col] ?? ''),
      String(result.results[i]?.prediction ?? ''),
      String(result.results[i]?.probability ?? ''),
    ]);
    downloadCsv('batch_predictions.csv', headers, data);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Batch prediction</h1>
        <p className="mt-2 text-slate-600">
          Upload a CSV with BRFSS schema (≤10MB). If HeartDiseaseorAttack labels are present, metrics are computed (AC-063).
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-4 text-sm text-slate-600">
          Required columns: {BRFSS_FEATURE_COLUMNS.join(', ')}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={(e) => void handleFile(e)}
          className="mt-4 text-sm"
        />
        {fileName && (
          <p className="mt-2 text-sm font-medium text-slate-700">
            {fileName} — {rowCount} rows parsed
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Model
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading || rowCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Run batch
        </button>
        {result && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 font-medium hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Download results
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {result?.metrics && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>
            Accuracy: {(result.metrics.accuracy * 100).toFixed(2)}% · AUROC: {result.metrics.roc_auc.toFixed(3)} ·
            Rows: {result.metrics.rows}
          </p>
        </div>
      )}

      {result && result.results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Prediction</th>
                <th className="px-4 py-3">Probability</th>
              </tr>
            </thead>
            <tbody>
              {result.results.slice(0, 100).map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{row.prediction === 1 ? 'Elevated' : 'Lower'}</td>
                  <td className="px-4 py-2">{(row.probability * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.results.length > 100 && (
            <p className="px-4 py-2 text-xs text-slate-500">Showing first 100 of {result.results.length} rows.</p>
          )}
        </div>
      )}
    </div>
  );
};
