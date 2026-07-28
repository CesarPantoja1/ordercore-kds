import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-slate-400 mb-4">
        {icon || <Inbox className="w-16 h-16" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
