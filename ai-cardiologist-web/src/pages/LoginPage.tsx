import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activateTenant, discoverAuthSession, type TenantOption } from '../services/authService';
import { useAuth } from '../state/AuthProvider';
import type { AppRole } from '../lib/permissions';

type Step = 'email' | 'tenant';

export const LoginPage = () => {
  const { establishSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const session = await discoverAuthSession(email.trim());
      setTenants(session.tenants);
      if (session.tenants.length === 0) {
        setError('No organizations found for this email.');
        return;
      }
      if (session.tenants.length === 1) {
        await activateWorkspace(session.tenants[0].tenantId, session.tenants[0].role);
        return;
      }
      setStep('tenant');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not discover organizations.');
    } finally {
      setIsLoading(false);
    }
  };

  const activateWorkspace = async (tenantId: string, roleHint?: AppRole) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await activateTenant(email.trim(), tenantId);
      establishSession({
        user: { name: email.split('@')[0], email: email.trim() },
        role: result.role ?? roleHint ?? 'individual',
        token: result.token,
        tenantId: result.tenantId,
      });
      navigate(result.homePath || from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate tenant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl font-bold text-white shadow-lg shadow-brand-500/30">
          ♥
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Email-first tenant discovery for AI Cardiologist</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {step === 'email' && (
        <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Work email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="researcher@institute.edu"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isLoading ? 'Finding organizations…' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'tenant' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">
            Signed in as <strong>{email}</strong>. Choose an organization:
          </p>
          <ul className="space-y-2">
            {tenants.map((tenant) => (
              <li key={tenant.tenantId}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void activateWorkspace(tenant.tenantId, tenant.role)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="block font-medium text-slate-900">{tenant.name}</span>
                  <span className="text-xs text-slate-500">
                    {tenant.code} · {tenant.role}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setStep('email')} className="text-sm text-brand-600 hover:underline">
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
};
