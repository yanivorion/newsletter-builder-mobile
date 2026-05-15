// Base44-backed auth context.
// Mirrors the original AuthContext API surface used by the editor:
//   const { user, isAuthenticated, loading, signOut } = useAuth();
// The user object is whatever Base44 returns for `me()`.
// On the deployed *.base44.app domain, auth is cookie-based and `me()`
// resolves automatically.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!cancelled) setUser(me ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    try {
      await base44.auth.logout?.();
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
