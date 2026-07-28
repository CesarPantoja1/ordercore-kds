import { useNavigate } from 'react-router-dom';
import { Edit, XCircle, ArrowLeft } from 'lucide-react';
import type { ComandaOut } from '../../api/comandas';
import PlatoStatusList from './PlatoStatusList';
import TimerBadge from './TimerBadge';

interface ComandaDetailProps {
  comanda: ComandaOut;
  onEdit?: () => void;
  onCancelComanda?: () => void;
  onCancelPlato?: (platoId: number) => void;
}

const prioridadColors: Record<string, string> = {
  Normal: 'bg-blue-100 text-blue-700',
  Alta: 'bg-amber-100 text-amber-700',
  Urgente: 'bg-red-100 text-red-700',
};

export default function ComandaDetail({ comanda, onEdit, onCancelComanda, onCancelPlato: _onCancelPlato }: ComandaDetailProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate('/comandas')}
              className="mt-1 text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  Comanda #{comanda.id}
                </h2>
                <span className={`text-xs font-medium px-3 py-1 rounded-xl ${prioridadColors[comanda.prioridad] || 'bg-slate-100 text-slate-700'}`}>
                  {comanda.prioridad}
                </span>
                <TimerBadge timestamp={comanda.fecha_creacion} />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Mesa {comanda.mesa}</span>
                <span>•</span>
                <span>{comanda.comensales} comensales</span>
                <span>•</span>
                <span className={`font-medium ${comanda.estado === 'Activa' ? 'text-green-600' : 'text-red-600'}`}>
                  {comanda.estado}
                </span>
              </div>
              {comanda.notas_cocina && (
                <p className="mt-2 text-sm text-slate-500 italic bg-slate-50 rounded-2xl px-4 py-2">
                  Notas: {comanda.notas_cocina}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comanda.estado === 'Activa' && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
            {comanda.estado === 'Activa' && onCancelComanda && (
              <button
                type="button"
                onClick={onCancelComanda}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all"
              >
                <XCircle className="w-4 h-4" />
                Cancelar comanda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Platos */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">
          Platos ({comanda.platos.length})
        </h3>
        <PlatoStatusList platos={comanda.platos} />
      </div>
    </div>
  );
}
