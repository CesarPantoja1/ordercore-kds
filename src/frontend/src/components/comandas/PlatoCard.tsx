import type { EstadoPlato } from '../../api/comandas';

interface PlatoCardProps {
  plato: {
    id: number;
    nombre_plato: string;
    estacion: string;
    estado: EstadoPlato;
    modificadores: string[];
    notas?: string;
    fecha_creacion: string;
  };
  onCancel?: (platoId: number) => void;
  onClick?: () => void;
}

const estadoColors: Record<EstadoPlato, string> = {
  'En cola': 'bg-slate-100 text-slate-700',
  'En preparación': 'bg-amber-100 text-amber-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
};

const estacionColors: Record<string, string> = {
  Parrilla: 'bg-orange-100 text-orange-700',
  Fríos: 'bg-blue-100 text-blue-700',
  Bebidas: 'bg-purple-100 text-purple-700',
  Postres: 'bg-pink-100 text-pink-700',
  General: 'bg-slate-100 text-slate-700',
};

export default function PlatoCard({ plato, onCancel, onClick }: PlatoCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-slate-900">{plato.nombre_plato}</h4>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${estadoColors[plato.estado] || 'bg-slate-100 text-slate-700'}`}>
          {plato.estado}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${estacionColors[plato.estacion] || 'bg-slate-100 text-slate-700'}`}>
          {plato.estacion}
        </span>
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
        <p className="text-xs text-slate-500 italic mt-1">"{plato.notas}"</p>
      )}

      {onCancel && plato.estado !== 'Cancelado' && plato.estado !== 'Completado' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel(plato.id);
          }}
          className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
        >
          Cancelar plato
        </button>
      )}
    </div>
  );
}
