// lib/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
export type AuthUser = {
  id: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
  [key: string]: unknown; // allow other fields you store
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (newToken: string, newUser: AuthUser) => void;
  logout: () => void;
  refreshSession: (nextToken?: string | null) => Promise<AuthUser | null>;
  updateUser: (updates: Partial<AuthUser>) => void;
};

/* ─────────────────────────────────────────────
   Storage
   ───────────────────────────────────────────── */
const STORAGE_KEYS = {
  token: 'citemas_token',
  user: 'citemas_user',
} as const;

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as AuthUser) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

/* ─────────────────────────────────────────────
   Context
   ───────────────────────────────────────────── */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(
    async (nextToken?: string | null): Promise<AuthUser | null> => {
      const tokenToUse = nextToken ?? token;

      if (!tokenToUse) {
        setUser(null);
        setLoading(false);
        return null;
      }

      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });

        if (!res.ok) {
          logout();
          return null;
        }

        const data = await res.json();
        const raw = data?.user;
        const freshUser: AuthUser | null =
          raw && typeof raw === 'object'
            ? { ...raw, id: raw._id || raw.id }
            : null;

        if (!freshUser) {
          logout();
          return null;
        }

        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(freshUser));
        setUser(freshUser);
        return freshUser;
      } catch (error) {
        console.error('Session refresh failed:', error);
        logout();
        return null;
      }
    },
    [logout, token],
  );

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.token);
        const storedUser = getStoredUser();

        if (storedToken) {
          if (isTokenExpired(storedToken)) {
            logout();
            return;
          }
          setToken(storedToken);
          if (storedUser) setUser(storedUser);
          await refreshSession(storedToken);
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login(newToken: string, newUser: AuthUser) {
    const safeUser: AuthUser | null =
      newUser && typeof newUser === 'object'
        ? { ...newUser, id: newUser._id || newUser.id }
        : null;

    localStorage.setItem(STORAGE_KEYS.token, newToken);
    if (safeUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(safeUser));
    }
    setToken(newToken);
    setUser(safeUser);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, refreshSession, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}