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

/** Stateless social sign-in — no user records persisted on the server. */
export async function socialLogin(provider: SocialProvider): Promise<SocialLoginResponse> {
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
