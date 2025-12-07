// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { BackendUser, LoginRequest, LoginResponse } from '../types/auth';
import { loginApi } from '../api/authApi';
import type { Role } from '../types/user';

interface AuthContextValue {
  user: BackendUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    const data: LoginResponse = await loginApi(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles?.includes('ADMIN')) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: Role) => {
    if (!user) return false;
    return user.roles?.includes(role);
  };

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
