import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      {message && (
        <p className="text-sm text-slate-500">{message}</p>
      )}
    </div>
  );
}
