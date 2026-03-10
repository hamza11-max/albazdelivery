/**
 * Auth context - manages user session for mobile
 * Uses /api/auth/login; store user in SecureStore
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'albaz_user';
const TOKEN_KEY = 'authToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const stored = await SecureStore.getItemAsync(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
      else setUser(null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Invalid email or password');
    }
    const u = data.data?.user;
    if (!u) throw new Error('No user in response');
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
