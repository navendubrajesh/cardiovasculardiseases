import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { fetchReferences, type ReferenceEntry } from '../services/researchService';

const TOPIC_FILTERS = ['All', 'XAI', 'BRFSS', 'Ensembles', 'Ethics', 'Clinical'];

export const ReferencesPage = () => {
  const [references, setReferences] = useState<ReferenceEntry[]>([]);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchReferences();
        setReferences(data.references ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load references.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return references.filter((ref) => {
      const matchesTopic =
        topic === 'All' || ref.topics?.some((t) => t.toLowerCase().includes(topic.toLowerCase()));
      const haystack = `${ref.title} ${ref.authors ?? ''} ${ref.refId ?? ref.id ?? ''}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesTopic && matchesQuery;
    });
  }, [references, query, topic]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bibliography</h1>
        <p className="mt-2 text-slate-600">
          References from <code>/api/research/references</code> — synced to thesis citation index (AC-002).
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search references…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3"
          />
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {TOPIC_FILTERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-slate-500">Loading references…</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!loading && filtered.length === 0 && !error && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No references loaded. Add <code>references.json</code> to the docs repository.
        </p>
      )}

      <ul className="space-y-4">
        {filtered.map((ref, index) => (
          <li key={ref.refId ?? ref.id ?? index} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-brand-600">{ref.refId ?? ref.id ?? `REF-${index + 1}`}</p>
            <h2 className="mt-1 font-semibold text-slate-900">{ref.title}</h2>
            {ref.authors && <p className="mt-1 text-sm text-slate-600">{ref.authors}{ref.year ? ` (${ref.year})` : ''}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {ref.doi && (
                <a
                  href={`https://doi.org/${ref.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                >
                  DOI <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {ref.url && (
                <a href={ref.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                  Link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {ref.topics && ref.topics.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ref.topics.map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
