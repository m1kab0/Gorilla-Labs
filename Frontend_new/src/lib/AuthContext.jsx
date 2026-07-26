import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken as persistToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api('/auth/me');
      setUser(me);
    } catch (_) {
      persistToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  async function login(email, password) {
    const tokenRes = await api('/auth/login', { method: 'POST', form: { username: email, password } });
    persistToken(tokenRes.access_token);
    const me = await api('/auth/me');
    setUser(me);
  }

  async function register(email, password, displayName) {
    await api('/auth/register', { method: 'POST', body: { email, password, display_name: displayName || null } });
    await login(email, password);
  }

  function logout() {
    persistToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  return ctx;
}
