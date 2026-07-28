import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { setupStatus, getCurrentUser } from '../api/auth';
import { setToken, removeToken, setUser, removeUser, getToken, getUser } from '../api/client';
import type { UserOut } from '../api/auth';

interface AuthContextType {
  user: UserOut | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  setupLoading: boolean;
  loginSuccess: (token: string, user: UserOut) => void;
  logoutAction: () => void;
  refreshUser: () => Promise<void>;
  refreshSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserOut | null>(() => getUser<UserOut>());
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUserState(currentUser);
      setUser(currentUser);
    } catch {
      removeToken();
      removeUser();
      setUserState(null);
    }
  }, []);

  const refreshSetupStatus = useCallback(async () => {
    try {
      const status = await setupStatus();
      setSetupRequired(!status.setup_completed);
      setSetupLoading(false);
    } catch {
      setSetupRequired(true);
      setSetupLoading(false);
    }
  }, []);

  // On mount: check setup status first
  useEffect(() => {
    let cancelled = false;
    async function init() {
      // Check setup status
      try {
        const status = await setupStatus();
        if (!cancelled) {
          setSetupRequired(!status.setup_completed);
          setSetupLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSetupRequired(true);
          setSetupLoading(false);
        }
      }

      // Check existing auth
      const token = getToken();
      if (token) {
        try {
          const currentUser = await getCurrentUser();
          if (!cancelled) {
            setUserState(currentUser);
            setUser(currentUser);
          }
        } catch {
          if (!cancelled) {
            removeToken();
            removeUser();
            setUserState(null);
          }
        }
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const loginSuccess = useCallback((token: string, userData: UserOut) => {
    setToken(token);
    setUser(userData);
    setUserState(userData);
  }, []);

  const logoutAction = useCallback(() => {
    removeToken();
    removeUser();
    setUserState(null);
  }, []);

  const isAuthenticated = !!user && user.activo;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        setupRequired,
        setupLoading,
        loginSuccess,
        logoutAction,
        refreshUser,
        refreshSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Guard components
export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, setupRequired, setupLoading, user } = useAuth();

  if (setupLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup-wizard" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, setupRequired, setupLoading } = useAuth();

  if (setupLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup-wizard" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
