import { useParams, useNavigate } from 'react-router-dom';
import CancelDialog from '../components/comandas/CancelDialog';
import { useComanda, useCancelComanda } from '../hooks/useComandas';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

export default function ComandaCancelPage() {
  const { id } = useParams<{ id: string }>();
  const comandaId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();

  const { comanda, isLoading, error } = useComanda(comandaId);
  const { cancel, isSubmitting, submitError } = useCancelComanda();

  const handleConfirm = async (motivo: string) => {
    if (!comandaId) return;
    const result = await cancel(comandaId, { motivo });
    if (result) {
      navigate('/comandas');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/comandas')} />;
  }

  if (!comanda) {
    return <ErrorState message="Comanda no encontrada" onRetry={() => navigate('/comandas')} />;
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Cancelar comanda #{comanda.id}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Mesa {comanda.mesa} • {comanda.comensales} comensales • {comanda.platos.length} platos
        </p>
        <CancelDialog
          comandaId={comanda.id}
          onConfirm={handleConfirm}
          onClose={() => navigate(`/comandas/${comandaId}`)}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      </div>
    </div>
  );
}
