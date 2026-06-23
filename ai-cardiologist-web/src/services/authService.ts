import type { AppRole } from '../lib/permissions';
import { getApiBaseUrl } from '../lib/apiClient';
import { formatApiError } from '../lib/formatApiError';

export type SocialProvider = 'google' | 'github' | 'apple' | 'linkedin';

export type SocialLoginResponse = {
  token: string;
  role: AppRole;
  homePath: string;
  tenantId: string;
  user: {
    displayName: string;
    email: string;
    provider: SocialProvider;
  };
};

const PROVIDER_DISPLAY: Record<SocialProvider, string> = {
  google: 'Google User',
  github: 'GitHub User',
  apple: 'Apple User',
  linkedin: 'LinkedIn User',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wake Render free-tier API (may sleep after inactivity). */
export async function wakeApi(maxAttempts = 4): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/health`, { method: 'GET' });
      if (res.ok) return;
      lastError = new Error(`Health check failed (${res.status})`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(2500 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not reach the API');
}

/** Stateless social sign-in — no user records persisted on the server. */
export async function socialLogin(
  provider: SocialProvider,
  onStatus?: (message: string) => void,
): Promise<SocialLoginResponse> {
  onStatus?.('Connecting to API…');
  await wakeApi();

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      onStatus?.(attempt === 0 ? 'Signing in…' : `Retrying sign-in (${attempt + 1}/3)…`);
      const res = await fetch(`${getApiBaseUrl()}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          displayName: PROVIDER_DISPLAY[provider],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(formatApiError(body.detail, `Social sign-in failed (${res.status})`));
      }
      return res.json();
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await sleep(2000 * (attempt + 1));
        await wakeApi(2);
      }
    }
  }

  if (lastError instanceof TypeError && /fetch/i.test(lastError.message)) {
    throw new Error(
      'Could not reach the API. The server may be waking up — please wait a moment and try again.',
    );
  }
  throw lastError instanceof Error ? lastError : new Error('Sign-in failed. Please try again.');
}

// Legacy email flow retained for local/dev tooling — not used by LoginPage.
export type TenantOption = {
  tenantId: string;
  name: string;
  code: string;
  role: AppRole;
};

export async function discoverAuthSession(email: string): Promise<{ tenants: TenantOption[] }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body.detail, `Session discovery failed (${res.status})`));
  }
  return res.json();
}

export async function activateTenant(email: string, tenantId: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/active-tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, tenantId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body.detail, `Tenant activation failed (${res.status})`));
  }
  return res.json();
}
