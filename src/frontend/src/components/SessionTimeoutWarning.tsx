import { Clock, RefreshCw } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export default function SessionTimeoutWarning() {
  const { showWarning, secondsLeft, extendSession } = useSession();

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">
              Sesión próxima a expirar
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              Tu sesión expirará en {secondsLeft} segundos. Extiéndela para no perder tu sesión.
            </p>
            <button
              onClick={extendSession}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Extender sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
