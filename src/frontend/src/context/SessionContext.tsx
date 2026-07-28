import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { refreshSession } from '../api/auth';

interface SessionContextType {
  secondsLeft: number | null;
  showWarning: boolean;
  extendSession: () => Promise<void>;
  resetActivityTimer: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULT_TIMEOUT_MINUTES = 30;
const WARNING_SECONDS = 60;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeoutMinutes] = useState(DEFAULT_TIMEOUT_MINUTES);
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    clearTimer();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000;
      const total = timeoutMinutes * 60;
      const remaining = Math.max(0, total - elapsed);

      setSecondsLeft(Math.floor(remaining));

      if (remaining <= WARNING_SECONDS && remaining > 0) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        clearTimer();
        setSecondsLeft(0);
        setShowWarning(false);
      }
    }, 1000);
  }, [timeoutMinutes, clearTimer]);

  const extendSession = useCallback(async () => {
    try {
      await refreshSession();
      resetActivityTimer();
    } catch {
      // ignore
    }
  }, [resetActivityTimer]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetActivityTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    resetActivityTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimer();
    };
  }, [resetActivityTimer, clearTimer]);

  return (
    <SessionContext.Provider
      value={{
        secondsLeft,
        showWarning,
        extendSession,
        resetActivityTimer,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
