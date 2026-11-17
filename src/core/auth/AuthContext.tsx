import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountRole, AuthUser, LoginRequest, RegisterAccountRequest } from '../api/types';
import { authApi } from '../api/authApi';
import { refreshSession } from '../api/client';
import { tokenStorage } from './tokenStorage';
import { extractAuthUser, isTokenExpired } from '../utils/jwt';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canWrite: boolean;
  canModerate: boolean;
  isMockMode: boolean;
  setMockMode: (enabled: boolean) => void;
  setDevRole: (role: AccountRole) => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterAccountRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockMode, setIsMockModeState] = useState<boolean>(tokenStorage.isMockMode());

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      const storedUser = tokenStorage.getUser();
      try {
        if (tokenStorage.isMockMode() && storedUser) {
          if (!cancelled) setUser(storedUser);
          return;
        }
        let accessToken = tokenStorage.getAccessToken();
        if ((!accessToken || isTokenExpired(accessToken)) && tokenStorage.getRefreshToken()) {
          await refreshSession();
          accessToken = tokenStorage.getAccessToken();
        }
        if (accessToken && !isTokenExpired(accessToken)) {
          const parsedUser = extractAuthUser(accessToken, storedUser?.email);
          if (parsedUser && !cancelled) {
            tokenStorage.setUser(parsedUser);
            setUser(parsedUser);
          }
        } else if (!tokenStorage.getRefreshToken()) {
          tokenStorage.clear();
        }
      } catch {
        // The request client handles expired sessions. Keep the login form usable.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    initialize();
    // Listen for global auth expiration events from API client
    const handleAuthExpired = () => {
      setUser(null);
    };
    const handleAuthRefreshed = () => {
      const token = tokenStorage.getAccessToken();
      const currentUser = token && extractAuthUser(token, tokenStorage.getUser()?.email);
      if (currentUser) {
        tokenStorage.setUser(currentUser);
        setUser(currentUser);
      }
    };
    window.addEventListener('editorial_auth_expired', handleAuthExpired);
    window.addEventListener('editorial_auth_refreshed', handleAuthRefreshed);
    return () => {
      cancelled = true;
      window.removeEventListener('editorial_auth_expired', handleAuthExpired);
      window.removeEventListener('editorial_auth_refreshed', handleAuthRefreshed);
    };
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      tokenStorage.setAccessToken(res.accessToken);
      tokenStorage.setRefreshToken(res.refreshToken);

      const parsedUser = extractAuthUser(res.accessToken, data.email);
      if (!parsedUser) throw new Error('Сервер вернул некорректный токен входа.');

      tokenStorage.setUser(parsedUser);
      setUser(parsedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterAccountRequest) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken });
      } catch (e) {
        console.warn('Logout request failed:', e);
      }
    }
    tokenStorage.clear();
    setUser(null);
  };

  const setMockMode = (enabled: boolean) => {
    tokenStorage.clear();
    setUser(null);
    tokenStorage.setMockMode(enabled);
    setIsMockModeState(enabled);
  };

  const setDevRole = (newRole: AccountRole) => {
    if (!isMockMode) return;
    if (!user) {
      const dummyUser: AuthUser = {
        accountId: 99,
        username: 'dev_user',
        email: 'dev@editorial.local',
        role: newRole,
      };
      tokenStorage.setUser(dummyUser);
      setUser(dummyUser);
      return;
    }
    const updated = { ...user, role: newRole };
    tokenStorage.setUser(updated);
    setUser(updated);
  };

  const canWrite = Boolean(
    user && (user.role === 'AUTHOR' || user.role === 'EDITOR' || user.role === 'ADMIN')
  );
  const canModerate = Boolean(
    user && (user.role === 'EDITOR' || user.role === 'ADMIN')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        canWrite,
        canModerate,
        isMockMode,
        setMockMode,
        setDevRole,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
