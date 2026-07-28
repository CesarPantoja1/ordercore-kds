import { useParams, useNavigate } from 'react-router-dom';
import ComandaEditForm from '../components/comandas/ComandaEditForm';
import { useComanda, useUpdateComanda } from '../hooks/useComandas';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import type { Prioridad } from '../api/comandas';

export default function ComandaEditPage() {
  const { id } = useParams<{ id: string }>();
  const comandaId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();

  const { comanda, isLoading, error, refetch } = useComanda(comandaId);
  const { update, isSubmitting, submitError } = useUpdateComanda();

  const handleSubmit = async (data: {
    mesa?: number;
    comensales?: number;
    platos?: { id?: number | null; catalogo_plato_id: number; modificadores?: string[]; notas?: string }[];
    notas_cocina?: string;
    prioridad?: Prioridad;
  }) => {
    if (!comandaId) return;
    const result = await update(comandaId, {
      mesa: data.mesa,
      comensales: data.comensales,
      platos: data.platos,
      notas_cocina: data.notas_cocina,
      prioridad: data.prioridad,
    });
    if (result) {
      navigate(`/comandas/${comandaId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
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
    <div className="max-w-2xl mx-auto">
      <ComandaEditForm
        comanda={comanda}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/comandas/${comandaId}`)}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  );
}
