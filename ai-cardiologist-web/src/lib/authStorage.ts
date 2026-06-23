import type { AppRole } from './permissions';

export type AuthUser = {
  name: string;
  email: string;
  provider?: 'google' | 'github' | 'apple' | 'linkedin';
};

const AUTH_SESSION_KEY = 'aicardio.auth.session';

export type StoredAuthSession = {
  user: AuthUser;
  role: AppRole;
  token: string;
  tenantId: string;
};

export function loadAuthSession(): StoredAuthSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: StoredAuthSession): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}
