import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem('studyseat_session');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession());

  const login = useCallback((token, user) => {
    const next = { token, user };
    localStorage.setItem('studyseat_session', JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('studyseat_session');
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
