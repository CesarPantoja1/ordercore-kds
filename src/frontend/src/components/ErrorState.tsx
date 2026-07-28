import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-red-400 mb-4">
        <AlertCircle className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Error</h3>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl shadow-sm hover:bg-red-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}
