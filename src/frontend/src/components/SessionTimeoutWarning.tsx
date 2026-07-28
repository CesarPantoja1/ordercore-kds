import { Clock, AlertTriangle } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export default function SessionTimeoutWarning() {
  const { showWarning, secondsLeft, extendSession } = useSession();

  if (!showWarning || secondsLeft === null || secondsLeft <= 0 || secondsLeft > 60) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Sesión próxima a expirar
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Tu sesión expirará en <strong className="text-amber-600">{secondsLeft} segundos</strong>.
          ¿Deseas extenderla?
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
          <Clock className="w-4 h-4" />
          <span>Inactividad detectada</span>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={extendSession}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all font-medium"
          >
            Extender sesión
          </button>
        </div>
      </div>
    </div>
  );
}
