import { AuthUser } from '../api/types';

const ACCESS_TOKEN_KEY = 'editorial_access_token';
const REFRESH_TOKEN_KEY = 'editorial_refresh_token';
const USER_KEY = 'editorial_user';
const MOCK_MODE_KEY = 'editorial_mock_mode';

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isMockMode(): boolean {
    const item = localStorage.getItem(MOCK_MODE_KEY);
    // If not set, default to false (connect to real backend if available)
    return item === 'true';
  },

  setMockMode(enabled: boolean): void {
    localStorage.setItem(MOCK_MODE_KEY, String(enabled));
  },
};
