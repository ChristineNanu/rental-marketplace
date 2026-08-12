import { API_BASE_URL } from './constants';

export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem('access_token', access_token);
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  localStorage.removeItem('is_admin');
  // Bust the Nav /me cache so the next login gets a fresh fetch
  if (typeof window !== 'undefined') window.__meCache = null;
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new Error('No refresh token');
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setTokens(data);
  return data.access_token;
}

/**
 * fetch() wrapper: attaches the access token, and on a 401 tries a single
 * refresh-and-retry before giving up and forcing a logout.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const withAuth = (token) => ({
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  let res = await fetch(url, withAuth(getAccessToken()));
  if (res.status !== 401 || !getRefreshToken()) return res;

  try {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    res = await fetch(url, withAuth(newToken));
  } catch {
    clearAuth();
    window.location.href = '/';
  }
  return res;
}
