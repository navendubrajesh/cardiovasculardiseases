import { Shield, BookOpen, Scale } from 'lucide-react';

const GOVERNANCE_CITATIONS = [
  {
    title: 'FUTURE-AI Guiding Principles',
    description: 'Fairness, Universality, Traceability, Usability, Robustness, Explainability for health AI.',
    ref: 'REF_7 — Lancet Digital Health FUTURE-AI consensus',
  },
  {
    title: 'FAIR-AI Framework',
    description: 'Findable, Accessible, Interoperable, Reusable AI assets for reproducible cardiovascular research.',
    ref: 'Ethics & transparency requirements (AC-001)',
  },
  {
    title: 'AHA Scientific Statement on AI in CVD',
    description: 'Clinical decision-support boundaries, validation expectations, and patient safety guardrails.',
    ref: 'American Heart Association scientific statement',
  },
];

export const GovernancePage = () => (
  <div className="space-y-10">
    <div>
      <h1 className="text-3xl font-bold">Clinical governance</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        AI Cardiologist is a research demonstration for population-level cardiovascular risk screening. It supports
        clinical decision-making but does not replace qualified medical judgment (AC-001).
      </p>
    </div>

    <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-1 h-6 w-6 text-red-600" />
        <div>
          <h2 className="text-lg font-bold text-red-900">Decision-support disclaimer</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-red-900">
            <li>Outputs are probabilistic estimates from self-reported BRFSS survey data.</li>
            <li>Not intended for emergency diagnosis, treatment, or triage decisions.</li>
            <li>Individual risk requires in-person clinical assessment and guideline-based tools (e.g., ASCVD PCE).</li>
            <li>Predictions are blocked until the session disclaimer is acknowledged once per browser session.</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="grid gap-6 md:grid-cols-3">
      {GOVERNANCE_CITATIONS.map((item) => (
        <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <BookOpen className="h-7 w-7 text-brand-600" />
          <h2 className="mt-4 font-semibold">{item.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          <p className="mt-3 text-xs font-medium text-slate-500">{item.ref}</p>
        </article>
      ))}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <div className="flex items-start gap-3">
        <Scale className="h-6 w-6 text-brand-600" />
        <div>
          <h2 className="text-xl font-bold">Responsible use policy</h2>
          <p className="mt-3 text-slate-600">
            Model comparisons and ELI5 explanations are provided for transparency under thesis and journal
            methodology. Subgroup fairness evaluation (AC-034) and prospective clinician validation (AC-091) are
            planned Phase 3 enhancements. Until then, treat all outputs as exploratory research artifacts.
          </p>
        </div>
      </div>
    </section>
  </div>
);
