import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        Algo salió mal
      </h3>
      {message && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}
