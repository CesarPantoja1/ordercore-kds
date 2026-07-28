import { X, Plus } from 'lucide-react';
import type { PlatoComandaOut } from '../../api/comandas';

interface PlatoEditListProps {
  platos: PlatoComandaOut[];
  onUpdate: (platoId: number, cambios: { modificadores?: string[]; notas?: string }) => void;
  onRemove: (platoId: number) => void;
}

export default function PlatoEditList({ platos, onUpdate, onRemove }: PlatoEditListProps) {
  const platosEditables = platos.filter((p) => p.estado === 'En cola');
  const platosBloqueados = platos.filter((p) => p.estado !== 'En cola');

  if (platosEditables.length === 0 && platosBloqueados.length > 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <p className="text-sm text-amber-700">
          No hay platos editables. Todos los platos están en estado "En preparación" o superior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Editables */}
      {platosEditables.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Platos editables</h4>
          <div className="space-y-3">
            {platosEditables.map((plato) => (
              <PlatoEditableItem
                key={plato.id}
                plato={plato}
                onUpdate={(cambios) => onUpdate(plato.id, cambios)}
                onRemove={() => onRemove(plato.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bloqueados */}
      {platosBloqueados.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-2">Platos en preparación (no editables)</h4>
          <div className="space-y-2">
            {platosBloqueados.map((plato) => (
              <div
                key={plato.id}
                className="bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{plato.nombre_plato}</p>
                    <p className="text-xs text-slate-400">{plato.estacion} • {plato.estado}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlatoEditableItem({
  plato,
  onUpdate,
  onRemove,
}: {
  plato: PlatoComandaOut;
  onUpdate: (cambios: { modificadores?: string[]; notas?: string }) => void;
  onRemove: () => void;
}) {
  const agregarModificador = () => {
    const nuevos = [...(plato.modificadores || []), ''];
    onUpdate({ modificadores: nuevos });
  };

  const actualizarModificador = (index: number, valor: string) => {
    const nuevos = [...(plato.modificadores || [])];
    nuevos[index] = valor;
    onUpdate({ modificadores: nuevos });
  };

  const quitarModificador = (index: number) => {
    const nuevos = (plato.modificadores || []).filter((_, i) => i !== index);
    onUpdate({ modificadores: nuevos });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{plato.nombre_plato}</p>
          <p className="text-xs text-slate-400">{plato.estacion}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 p-1"
          title="Quitar plato"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Modificadores */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-500">Modificadores</label>
          <button
            type="button"
            onClick={agregarModificador}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>
        {(plato.modificadores || []).length > 0 ? (
          <div className="space-y-1.5">
            {(plato.modificadores || []).map((mod, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={mod}
                  onChange={(e) => actualizarModificador(i, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Modificador"
                />
                <button
                  type="button"
                  onClick={() => quitarModificador(i)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin modificadores</p>
        )}
      </div>
    </div>
  );
}
