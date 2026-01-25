import React, { createContext, useContext, useEffect, useState } from 'react';
import { message } from 'antd';

import type { AdminUser } from '../lib/api';
import { adminLogin, adminLogout, adminMe } from '../lib/api';

type AuthContextType = {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await adminMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await adminLogin(username, password);
      setUser(res.user);
      message.success('登入成功');
      return true;
    } catch (e: any) {
      const errorMsg = e?.message || '登入失敗';
      message.error(errorMsg);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await adminLogout();
      setUser(null);
      message.success('已登出');
    } catch {
      // 即使登出失敗，也清除本地狀態
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

