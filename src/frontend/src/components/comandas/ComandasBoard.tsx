import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import type { ComandaResumenOut } from '../../api/comandas';
import Skeleton from '../Skeleton';
import EmptyState from '../EmptyState';
import ErrorState from '../ErrorState';
import FiltroEstacion from './FiltroEstacion';
import { useAuth } from '../../context/AuthContext';

interface ComandasBoardProps {
  comandas: ComandaResumenOut[];
  isLoading: boolean;
  error: string | null;
  filtroEstacion: string;
  onFiltroChange: (estacion: string) => void;
  estaciones: string[];
  onRefetch: () => void;
}

const prioridadColors: Record<string, string> = {
  Normal: 'border-l-blue-400',
  Alta: 'border-l-amber-400',
  Urgente: 'border-l-red-500',
};

const prioridadBgColors: Record<string, string> = {
  Normal: 'bg-blue-50 text-blue-700',
  Alta: 'bg-amber-50 text-amber-700',
  Urgente: 'bg-red-50 text-red-700',
};

function ComandaCard({ comanda, onClick }: { comanda: ComandaResumenOut; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${prioridadColors[comanda.prioridad] || 'border-l-blue-400'} p-4 hover:shadow-md transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900">Mesa {comanda.mesa}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${prioridadBgColors[comanda.prioridad] || 'bg-blue-50 text-blue-700'}`}>
              {comanda.prioridad}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {comanda.comensales} comensales • {comanda.tiempo_transcurrido}
          </p>
        </div>
        <span className="text-xs font-bold text-slate-700">#{comanda.id}</span>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>{comanda.platos_count} platos</span>
        </div>
        <span className="text-slate-300">•</span>
        <span className="text-green-600 font-medium">{comanda.platos_activos} activos</span>
      </div>
    </div>
  );
}

export default function ComandasBoard({
  comandas,
  isLoading,
  error,
  filtroEstacion,
  onFiltroChange,
  estaciones,
  onRefetch,
}: ComandasBoardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'jefe_cocina' || user?.rol === 'gerente';

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRefetch} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Comandas activas</h1>
          <p className="text-sm text-slate-500 mt-1">
            {comandas.length} comanda{comandas.length !== 1 ? 's' : ''} activa{comandas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/comandas/crear')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva comanda
        </button>
      </div>

      {/* Filtro por estación (solo admin/gerente) */}
      {isAdmin && (
        <div className="mb-6">
          <FiltroEstacion
            estaciones={estaciones}
            seleccion={filtroEstacion}
            onChange={onFiltroChange}
          />
        </div>
      )}

      {/* Comandas grid */}
      {comandas.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-16 h-16 text-slate-300" />}
          title="No hay comandas activas"
          description="Todas las comandas han sido completadas. Crea una nueva para comenzar."
          actionLabel="Crear comanda"
          onAction={() => navigate('/comandas/crear')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandas.map((comanda) => (
            <ComandaCard
              key={comanda.id}
              comanda={comanda}
              onClick={() => navigate(`/comandas/${comanda.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
