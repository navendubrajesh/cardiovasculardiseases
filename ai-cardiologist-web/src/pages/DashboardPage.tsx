import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, History, Users } from 'lucide-react';
import { useAuth } from '../state/AuthProvider';
import { fetchPredictionHistory } from '../services/predictionsService';
import { fetchModelMetrics } from '../services/researchService';

export const DashboardPage = () => {
  const { user, role, tenantId } = useAuth();
  const [predictionCount, setPredictionCount] = useState<number | null>(null);
  const [modelCount, setModelCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [history, metrics] = await Promise.all([
          fetchPredictionHistory().catch(() => ({ predictions: [] })),
          fetchModelMetrics().catch(() => ({ models: {} })),
        ]);
        setPredictionCount(history.predictions?.length ?? 0);
        setModelCount(Object.keys(metrics.models ?? {}).length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load dashboard data.');
      }
    })();
  }, []);

  const cards = [
    {
      label: 'Your role',
      value: role,
      icon: Users,
      href: '/governance',
    },
    {
      label: 'Predictions (tenant)',
      value: predictionCount ?? '—',
      icon: History,
      href: '/predict',
    },
    {
      label: 'Models in registry',
      value: modelCount ?? '—',
      icon: BarChart3,
      href: '/models',
    },
    {
      label: 'Quick predict',
      value: 'Run',
      icon: Activity,
      href: '/predict',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome{user ? `, ${user.name}` : ''}. Tenant: <code>{tenantId ?? '—'}</code>
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <Icon className="h-6 w-6 text-brand-600" />
              <p className="mt-4 text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold capitalize text-slate-900">{String(card.value)}</p>
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Getting started</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Acknowledge the clinical disclaimer banner at the top of the page.</li>
          <li>Run a single prediction with 21 BRFSS fields or load a thesis demo scenario.</li>
          <li>Compare models on the leaderboard and explore the research bibliography.</li>
        </ol>
      </section>
    </div>
  );
};
