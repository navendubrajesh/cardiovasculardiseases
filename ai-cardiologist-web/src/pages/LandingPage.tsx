import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Brain, FileText, Shield } from 'lucide-react';

export const LandingPage = () => (
  <div className="space-y-16">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 px-8 py-16 text-white shadow-xl">
      <div className="relative z-10 max-w-3xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">AC-050 · Research Demo</p>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          AI Cardiologist — Explainable cardiovascular risk from BRFSS survey data
        </h1>
        <p className="text-lg text-brand-100">
          Population-level screening and decision-support built on BRFSS 2015 (253,680 records, 21 predictors).
          Ensemble voting achieves <strong>89.1% test accuracy</strong> with ELI5 local and global explanations.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Try prediction
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/research"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            View research
            <FileText className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>

    <section className="grid gap-6 md:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Brain className="h-8 w-8 text-brand-600" />
        <h2 className="mt-4 text-lg font-semibold">Problem</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cardiovascular disease remains a leading cause of mortality. Self-reported BRFSS indicators enable
          scalable, survey-based risk modelling aligned with thesis Chapter 4.
        </p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <BarChart3 className="h-8 w-8 text-brand-600" />
        <h2 className="mt-4 text-lg font-semibold">Dataset &amp; Models</h2>
        <p className="mt-2 text-sm text-slate-600">
          21 BRFSS predictors with ~9.3% positive prevalence. Eight classifiers plus ensemble voting,
          compared on accuracy, F1, and ROC-AUC (AC-020–AC-028).
        </p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Shield className="h-8 w-8 text-brand-600" />
        <h2 className="mt-4 text-lg font-semibold">XAI &amp; Governance</h2>
        <p className="mt-2 text-sm text-slate-600">
          ELI5 global and local explanations, FUTURE-AI / FAIR-AI aligned disclaimers, and transparent
          model leaderboard for clinical decision-support ethics.
        </p>
      </article>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-2xl font-bold">Research summary</h2>
      <p className="mt-4 max-w-3xl text-slate-600">
        MS Navendu Brajesh V1.2 evaluates SVM, decision trees, k-NN, neural networks, random forest,
        XGBoost, ensembles, and ANFIS on HeartDiseaseorAttack. The journal submission selects ensemble
        voting for balanced performance and explainability. Explore predictions, batch CSV testing, and
        interactive model charts on this site.
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to="/models" className="font-medium text-brand-600 hover:underline">
          Model leaderboard →
        </Link>
        <Link to="/references" className="font-medium text-brand-600 hover:underline">
          Bibliography →
        </Link>
        <Link to="/governance" className="font-medium text-brand-600 hover:underline">
          Clinical governance →
        </Link>
      </div>
    </section>
  </div>
);
