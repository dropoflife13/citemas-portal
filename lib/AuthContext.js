'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore session from localStorage if it exists
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('citemas_token');
      const storedUser = localStorage.getItem('citemas_user');
      if (storedToken && storedUser && storedUser !== 'undefined') {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      localStorage.removeItem('citemas_token');
      localStorage.removeItem('citemas_user');
    }
    setLoading(false);
  }, []);

  function login(newToken, newUser) {
    localStorage.setItem('citemas_token', newToken);
    localStorage.setItem('citemas_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('citemas_token');
    localStorage.removeItem('citemas_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}