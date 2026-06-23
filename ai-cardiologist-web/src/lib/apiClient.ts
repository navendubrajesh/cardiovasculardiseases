const DEFAULT_API = 'http://127.0.0.1:8000';
const RENDER_API = 'https://ai-cardiologist-api.onrender.com';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    return RENDER_API;
  }
  return DEFAULT_API;
}

const apiBase = () => getApiBaseUrl();

let tokenGetter: (() => string | null) | null = null;

/** Register token accessor from AuthProvider. */
export function setApiTokenGetter(getter: () => string | null): void {
  tokenGetter = getter;
}

export function getApiAuthHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = tokenGetter?.();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = getApiAuthHeaders(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`;
    throw new Error(detail);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
