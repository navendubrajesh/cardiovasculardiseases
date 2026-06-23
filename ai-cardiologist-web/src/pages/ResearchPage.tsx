import { ExternalLink, FileText } from 'lucide-react';

const DOCUMENTS = [
  {
    title: 'MS Navendu Brajesh V1.2',
    type: 'Thesis',
    version: 'V1.2',
    author: 'Navendu Brajesh',
    abstract:
      'Comparative evaluation of machine learning classifiers for cardiovascular disease prediction using BRFSS 2015 survey data, with ensemble selection and ELI5 explainability.',
    href: '#',
  },
  {
    title: 'AI Cardiologist for Journals',
    type: 'Journal manuscript',
    version: 'Submitted',
    author: 'Navendu Brajesh et al.',
    abstract:
      'Journal submission reporting 89.1% ensemble test accuracy, ELI5 global/local explanations, and clinical decision-support framing with FUTURE-AI alignment.',
    href: '#',
  },
];

export const ResearchPage = () => (
  <div className="space-y-10">
    <div>
      <h1 className="text-3xl font-bold">Research hub</h1>
      <p className="mt-2 text-slate-600">
        Thesis and journal document links with metadata (AC-070). PDFs hosted via GitHub releases when available.
      </p>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {DOCUMENTS.map((doc) => (
        <article key={doc.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-50 p-3">
              <FileText className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{doc.type}</p>
              <h2 className="mt-1 text-xl font-bold">{doc.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {doc.author} · {doc.version}
              </p>
              <p className="mt-3 text-sm text-slate-600">{doc.abstract}</p>
              <a
                href={doc.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                Download PDF <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-xl font-bold">Methodology highlights</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
        <li>Dataset: BRFSS 2015 heart disease health indicators (253,680 rows, 21 predictors).</li>
        <li>Target: HeartDiseaseorAttack (self-reported CHD/MI).</li>
        <li>Models: SVM, DT, k-NN, NN, RF, XGBoost, Ensemble, ANFIS, Logistic Regression, Naive Bayes.</li>
        <li>Evaluation: Stratified split, ROC-AUC, recall under class imbalance, ELI5 XAI.</li>
        <li>Production default: Ensemble voting (~89.1% test accuracy).</li>
      </ul>
    </section>
  </div>
);
