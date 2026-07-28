import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import MotivoField from './MotivoField';

interface CancelDialogProps {
  comandaId: number;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function CancelDialog({ comandaId, onConfirm, onClose, isSubmitting, error }: CancelDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (motivo.length < 10) {
      setLocalError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    setLocalError(null);
    onConfirm(motivo);
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Cancelar comanda #{comandaId}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Esta acción cancelará todos los platos de la comanda. Esta operación no se puede deshacer.
        </p>

        <MotivoField
          value={motivo}
          onChange={setMotivo}
          error={displayError || undefined}
        />

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  );
}
