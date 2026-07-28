import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { refreshSession } from '../api/auth';
import { setToken } from '../api/client';

interface SessionContextType {
  secondsLeft: number;
  showWarning: boolean;
  extendSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const DEFAULT_TIMEOUT_MINUTES = 30;
const WARNING_BEFORE = 60; // 1 minute before timeout

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeoutMinutes] = useState(DEFAULT_TIMEOUT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_TIMEOUT_MINUTES * 60);
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset activity on user interaction
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      setLastActivity(Date.now());
      setShowWarning(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Register activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Tick every second
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastActivity) / 1000;
      const totalSeconds = timeoutMinutes * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(Math.floor(remaining));

      if (remaining <= WARNING_BEFORE && remaining > 0) {
        setShowWarning(true);
      } else if (remaining <= 0) {
        setShowWarning(false);
        // Force logout would happen here
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, lastActivity, timeoutMinutes, handleActivity]);

  const extendSession = useCallback(async () => {
    try {
      const res = await refreshSession();
      setToken(res.token);
      setLastActivity(Date.now());
      setShowWarning(false);
    } catch {
      // ignore
    }
  }, []);

  return (
    <SessionContext.Provider value={{ secondsLeft, showWarning, extendSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
