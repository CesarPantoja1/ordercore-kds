import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, setupStatus } from '../api/auth';
import type { UserOut } from '../api/auth';

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setupCompleted: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsAuthLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const checkSetup = useCallback(async () => {
    try {
      const status = await setupStatus();
      setSetupCompleted(status.setup_completed);
    } catch {
      setSetupCompleted(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsAuthLoading(true);
      await checkSetup();
      await checkAuth();
    };
    init();
  }, [checkAuth, checkSetup]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAuthLoading,
        setupCompleted,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
