import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { acknowledgeDisclaimer, isDisclaimerAcknowledged } from '../lib/disclaimer';

export const DisclaimerBanner = () => {
  const [visible, setVisible] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const ack = isDisclaimerAcknowledged();
    setAcknowledged(ack);
    setVisible(!ack);
  }, []);

  const handleAcknowledge = () => {
    acknowledgeDisclaimer();
    setAcknowledged(true);
    setVisible(false);
  };

  if (!visible || acknowledged) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="flex-1 space-y-1">
          <p className="font-semibold">Clinical decision-support disclaimer (AC-001)</p>
          <p>
            AI Cardiologist provides population-level cardiovascular risk screening for research and
            decision-support only. It is <strong>not</strong> a clinical diagnosis or substitute for
            professional medical advice. See{' '}
            <Link to="/governance" className="font-medium text-amber-900 underline">
              Governance
            </Link>{' '}
            for FUTURE-AI and FAIR-AI citations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAcknowledge}
          className="shrink-0 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
        >
          I understand
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100"
          aria-label="Dismiss banner temporarily"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
