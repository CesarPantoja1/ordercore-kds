import { X, Plus } from 'lucide-react';
import type { CatalogoPlatoOut } from '../../api/catalogo';

interface SelectorPlatosProps {
  platos: CatalogoPlatoOut[];
  seleccionados: CatalogoPlatoOut[];
  onSelect: (platos: CatalogoPlatoOut[]) => void;
}

export default function SelectorPlatos({ platos, seleccionados, onSelect }: SelectorPlatosProps) {
  const disponibles = platos.filter(
    (p) => !seleccionados.find((s) => s.id === p.id) && p.activo
  );

  const agregar = (plato: CatalogoPlatoOut) => {
    onSelect([...seleccionados, plato]);
  };

  const quitar = (platoId: number) => {
    onSelect(seleccionados.filter((s) => s.id !== platoId));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Platos <span className="text-red-500">*</span>
      </label>

      {/* Selected platos */}
      {seleccionados.length > 0 && (
        <div className="mb-3 space-y-2">
          {seleccionados.map((plato) => (
            <div
              key={plato.id}
              className="flex items-center justify-between bg-blue-50 rounded-2xl px-4 py-2.5 border border-blue-100"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{plato.nombre}</p>
                <p className="text-xs text-slate-500">{plato.estacion}</p>
              </div>
              <button
                type="button"
                onClick={() => quitar(plato.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available platos */}
      {disponibles.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {disponibles.map((plato) => (
            <button
              key={plato.id}
              type="button"
              onClick={() => agregar(plato)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-all"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">{plato.nombre}</p>
                <p className="text-xs text-slate-400">{plato.estacion}</p>
              </div>
              <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {disponibles.length === 0 && seleccionados.length === 0 && (
        <p className="text-sm text-slate-400">No hay platos disponibles</p>
      )}
    </div>
  );
}
