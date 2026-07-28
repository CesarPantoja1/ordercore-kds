import type { EstadoPlato } from '../../api/comandas';
import TimerBadge from './TimerBadge';

interface PlatoStatusListProps {
  platos: {
    id: number;
    nombre_plato: string;
    estacion: string;
    estado: EstadoPlato;
    modificadores: string[];
    notas?: string;
    fecha_creacion: string;
  }[];
}

const estadoColors: Record<EstadoPlato, string> = {
  'En cola': 'bg-slate-100 text-slate-700 border-slate-200',
  'En preparación': 'bg-amber-100 text-amber-700 border-amber-200',
  'Completado': 'bg-green-100 text-green-700 border-green-200',
  'Cancelado': 'bg-red-100 text-red-700 border-red-200',
};

export default function PlatoStatusList({ platos }: PlatoStatusListProps) {
  if (!platos || platos.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        No hay platos en esta comanda
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {platos.map((plato) => (
        <div
          key={plato.id}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-slate-900">{plato.nombre_plato}</h4>
              <p className="text-xs text-slate-400">{plato.estacion}</p>
            </div>
            <div className="flex items-center gap-2">
              <TimerBadge timestamp={plato.fecha_creacion} />
              <span className={`text-xs font-medium px-2.5 py-1 rounded-xl border ${estadoColors[plato.estado] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {plato.estado}
              </span>
            </div>
          </div>

          {plato.modificadores && plato.modificadores.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-slate-400 mb-1">Modificadores:</p>
              <div className="flex flex-wrap gap-1">
                {plato.modificadores.map((mod, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {plato.notas && (
            <p className="text-xs text-slate-500 italic">"{plato.notas}"</p>
          )}
        </div>
      ))}
    </div>
  );
}
