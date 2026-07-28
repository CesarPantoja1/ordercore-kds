import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComandaDetail from '../components/comandas/ComandaDetail';
import CancelDialog from '../components/comandas/CancelDialog';
import CancelPlatoDialog from '../components/comandas/CancelPlatoDialog';
import { useComanda, useCancelComanda, useCancelPlato } from '../hooks/useComandas';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

export default function ComandaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const comandaId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();

  const { comanda, isLoading, error, refetch } = useComanda(comandaId);
  const { cancel: cancelComanda, isSubmitting: cancellingComanda, submitError: cancelComandaError } = useCancelComanda();
  const { cancel: cancelPlato, isSubmitting: cancellingPlato, submitError: cancelPlatoError } = useCancelPlato();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelPlatoInfo, setCancelPlatoInfo] = useState<{ id: number; nombre: string } | null>(null);

  const handleCancelComanda = async (motivo: string) => {
    if (!comandaId) return;
    const result = await cancelComanda(comandaId, { motivo });
    if (result) {
      setShowCancelDialog(false);
      refetch();
    }
  };

  const handleCancelPlato = async (motivo: string) => {
    if (!comandaId || !cancelPlatoInfo) return;
    const success = await cancelPlato(comandaId, cancelPlatoInfo.id, { motivo });
    if (success) {
      setCancelPlatoInfo(null);
      refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" count={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (!comanda) {
    return <ErrorState message="Comanda no encontrada" onRetry={() => navigate('/comandas')} />;
  }

  return (
    <div>
      <ComandaDetail
        comanda={comanda}
        onEdit={() => navigate(`/comandas/${comanda.id}/editar`)}
        onCancelComanda={() => setShowCancelDialog(true)}
        onCancelPlato={(platoId) => {
          const plato = comanda.platos.find((p) => p.id === platoId);
          if (plato) {
            setCancelPlatoInfo({ id: platoId, nombre: plato.nombre_plato });
          }
        }}
      />

      {showCancelDialog && (
        <CancelDialog
          comandaId={comanda.id}
          onConfirm={handleCancelComanda}
          onClose={() => setShowCancelDialog(false)}
          isSubmitting={cancellingComanda}
          error={cancelComandaError}
        />
      )}

      {cancelPlatoInfo && (
        <CancelPlatoDialog
          comandaId={comanda.id}
          platoId={cancelPlatoInfo.id}
          platoNombre={cancelPlatoInfo.nombre}
          onConfirm={handleCancelPlato}
          onClose={() => setCancelPlatoInfo(null)}
          isSubmitting={cancellingPlato}
          error={cancelPlatoError}
        />
      )}
    </div>
  );
}
