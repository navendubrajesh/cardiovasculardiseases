import type { AppRole } from '../lib/permissions';
import { getApiBaseUrl } from '../lib/apiClient';
import { formatApiError } from '../lib/formatApiError';

export type TenantOption = {
  tenantId: string;
  name: string;
  code: string;
  role: AppRole;
};

export type AuthSessionResponse = {
  tenants: TenantOption[];
};

export type ActiveTenantResponse = {
  token: string;
  role: AppRole;
  homePath: string;
  tenantId: string;
};

export async function discoverAuthSession(email: string): Promise<AuthSessionResponse> {
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

export async function activateTenant(email: string, tenantId: string): Promise<ActiveTenantResponse> {
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
