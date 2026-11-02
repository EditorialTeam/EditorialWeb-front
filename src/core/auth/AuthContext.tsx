import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountRole, AuthUser, LoginRequest, RegisterAccountRequest } from '../api/types';
import { authApi } from '../api/authApi';
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
    // Initialize session from storage
    const storedUser = tokenStorage.getUser();
    const accessToken = tokenStorage.getAccessToken();

    if (accessToken && !isTokenExpired(accessToken)) {
      const parsedUser = extractAuthUser(accessToken, storedUser?.email);
      if (parsedUser) {
        setUser({
          ...parsedUser,
          username: storedUser?.username || parsedUser.username,
        });
      } else if (storedUser) {
        setUser(storedUser);
      }
    } else if (storedUser) {
      // Token expired or not present, but user cached; try to keep if refresh token exists
      if (tokenStorage.getRefreshToken()) {
        setUser(storedUser);
      } else {
        tokenStorage.clear();
      }
    }

    setIsLoading(false);

    // Listen for global auth expiration events from API client
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('editorial_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('editorial_auth_expired', handleAuthExpired);
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      tokenStorage.setAccessToken(res.accessToken);
      tokenStorage.setRefreshToken(res.refreshToken);

      const parsedUser = extractAuthUser(res.accessToken, data.email) || {
        accountId: 1,
        username: data.email.split('@')[0],
        email: data.email,
        role: 'USER',
      };

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
      // Auto-login after successful registration
      await login({ email: data.email, password: data.password });
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
    tokenStorage.setMockMode(enabled);
    setIsMockModeState(enabled);
  };

  const setDevRole = (newRole: AccountRole) => {
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
