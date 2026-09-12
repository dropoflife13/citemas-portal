'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  token: 'citemas_token',
  user: 'citemas_user',
};

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (nextToken = token) => {
    if (!nextToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${nextToken}` },
      });

      if (!res.ok) {
        logout();
        return null;
      }

      const data = await res.json();
      const freshUser = data?.user ? { ...data.user, id: data.user._id || data.user.id } : null;

      if (!freshUser) {
        logout();
        return null;
      }

      const userToStore = {
        ...freshUser,
        id: freshUser._id || freshUser.id,
      };

      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userToStore));
      setUser(userToStore);
      return userToStore;
    } catch (error) {
      console.error('Session refresh failed:', error);
      logout();
      return null;
    }
  }, [logout, token]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.token);
        const storedUser = getStoredUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }
          await refreshSession(storedToken);
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [logout, refreshSession]);

  function login(newToken, newUser) {
    const safeUser = newUser && typeof newUser === 'object' ? { ...newUser, id: newUser._id || newUser.id } : null;
    localStorage.setItem(STORAGE_KEYS.token, newToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(safeUser ?? {}));
    setToken(newToken);
    setUser(safeUser);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}