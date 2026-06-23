import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { ModelInfo } from '../services/predictionsService';

type ModelMultiSelectProps = {
  models: ModelInfo[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function ModelMultiSelect({ models, selected, onChange, disabled }: ModelMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length === 1) return; // keep at least one
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const enabledModels = models.filter((m) => !m.disabled);
  const allSelected = enabledModels.length > 0 && enabledModels.every((m) => selected.includes(m.id));
  const toggleAll = () => {
    onChange(allSelected ? [enabledModels[0]?.id].filter(Boolean) : enabledModels.map((m) => m.id));
  };

  const summary =
    selected.length === 0
      ? 'Select models'
      : selected.length === 1
        ? models.find((m) => m.id === selected[0])?.label ?? selected[0]
        : `${selected.length} models selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm disabled:opacity-50"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold text-brand-700 hover:bg-slate-50"
          >
            {allSelected ? 'Clear all (keep one)' : 'Select all available'}
          </button>
          <div className="my-1 h-px bg-slate-100" />
          {models.map((model) => {
            const checked = selected.includes(model.id);
            return (
              <button
                key={model.id}
                type="button"
                disabled={model.disabled}
                onClick={() => toggle(model.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate">
                  {model.label}
                  {model.latencyMs ? <span className="text-slate-400"> (~{model.latencyMs}ms)</span> : ''}
                </span>
                {model.disabled && <span className="text-xs text-slate-400">unavailable</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
