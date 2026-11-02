import { AccountRole, AuthUser } from '../api/types';

interface JwtPayload {
  sub?: string | number;
  role?: AccountRole;
  exp?: number;
  iss?: string;
  aud?: string;
  username?: string;
  email?: string;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractAuthUser(accessToken: string, fallbackEmail?: string): AuthUser | null {
  const payload = parseJwtPayload(accessToken);
  if (!payload || !payload.sub) return null;

  const accountId = typeof payload.sub === 'number' ? payload.sub : parseInt(payload.sub, 10);
  const role: AccountRole = payload.role || 'USER';

  return {
    accountId: isNaN(accountId) ? 0 : accountId,
    username: payload.username || fallbackEmail?.split('@')[0] || `user_${accountId}`,
    email: payload.email || fallbackEmail || '',
    role,
  };
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // Exp is in seconds, Date.now() in ms. Add 10-second margin.
  return payload.exp * 1000 <= Date.now() + 10000;
}
