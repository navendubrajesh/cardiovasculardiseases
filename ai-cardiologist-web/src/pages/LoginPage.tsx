import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { SocialLoginButtons, SocialLoginNote } from '../components/Auth/SocialLoginButtons';
import { socialLogin, type SocialProvider } from '../services/authService';
import { useAuth } from '../state/AuthProvider';

export const LoginPage = () => {
  const { establishSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/predict';

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setError(null);
    setStatus(null);
    setIsLoading(true);
    try {
      const result = await socialLogin(provider, setStatus);
      flushSync(() => {
        establishSession({
          user: {
            name: result.user.displayName,
            email: result.user.email,
            provider: result.user.provider,
          },
          role: result.role,
          token: result.token,
          tenantId: result.tenantId,
        });
      });
      const target = result.homePath || from;
      navigate(target.startsWith('/') ? target : `/${target}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
      setStatus(null);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl font-bold text-white shadow-lg shadow-brand-500/30">
          ♥
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Choose a provider to explore AI Cardiologist</p>
      </div>

      {status && (
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{status}</p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SocialLoginButtons disabled={isLoading} onSelect={(p) => void handleSocialLogin(p)} />
        <SocialLoginNote>
          Guest session — no account data is stored. The API may take up to 30 seconds to wake on first use.
        </SocialLoginNote>
      </div>
    </div>
  );
};
