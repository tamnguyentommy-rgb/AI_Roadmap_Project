"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/api';

interface AuthCtx {
  user: User | null;
  token: string | null;
  isLoaded: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, token: null, isLoaded: false,
  login: () => {}, logout: () => {}, updateUser: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (user: User, token: string) => {
    setUser(user); setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (u: Partial<User>) => {
    const updated = { ...user!, ...u };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <Ctx.Provider value={{ user, token, isLoaded, login, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
