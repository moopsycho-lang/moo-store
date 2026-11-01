// src/client/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../../types/index.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  quickLogin: (type: 'customer' | 'admin') => Promise<boolean>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot') => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  quickLogin: async () => false,
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  authModalMode: 'signin',
  setAuthModalMode: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('moo_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const { showToast } = useToast();

  const fetchCurrentUser = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token expired or invalid, try refresh
        const refRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (refRes.ok) {
          const refData = await refRes.json();
          setUser(refData.user);
          setAccessToken(refData.accessToken);
          localStorage.setItem('moo_token', refData.accessToken);
        } else {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('moo_token');
        }
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchCurrentUser(accessToken);
    } else {
      // Try refresh cookie on startup
      fetch('/api/auth/refresh', { method: 'POST' })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data) {
            setUser(data.user);
            setAccessToken(data.accessToken);
            localStorage.setItem('moo_token', data.accessToken);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [accessToken, fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to sign in', 'error');
        return false;
      }
      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('moo_token', data.accessToken);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      return true;
    } catch {
      showToast('Network error during login', 'error');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to create account', 'error');
        return false;
      }
      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('moo_token', data.accessToken);
      setIsAuthModalOpen(false);
      showToast('Account created successfully!', 'success');
      return true;
    } catch {
      showToast('Network error during registration', 'error');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('moo_token');
    showToast('Signed out of MOO.', 'info');
  };

  const quickLogin = async (type: 'customer' | 'admin') => {
    if (type === 'admin') {
      return login('admin@moo.store', 'admin123');
    }
    return login('customer@moo.store', 'password123');
  };

  const refreshUser = async () => {
    if (accessToken) {
      await fetchCurrentUser(accessToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
