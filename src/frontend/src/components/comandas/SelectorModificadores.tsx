import { X, Plus } from 'lucide-react';

interface SelectorModificadoresProps {
  platoId: number;
  modificadores: string[];
  onChange: (modificadores: string[]) => void;
}

export default function SelectorModificadores({ modificadores, onChange }: SelectorModificadoresProps) {
  const agregarModificador = () => {
    onChange([...modificadores, '']);
  };

  const actualizarModificador = (index: number, valor: string) => {
    const nuevos = [...modificadores];
    nuevos[index] = valor;
    onChange(nuevos);
  };

  const quitarModificador = (index: number) => {
    onChange(modificadores.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">Modificadores</label>
        <button
          type="button"
          onClick={agregarModificador}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {modificadores.length > 0 ? (
        <div className="space-y-2">
          {modificadores.map((mod, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={mod}
                onChange={(e) => actualizarModificador(i, e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej: Sin cebolla"
              />
              <button
                type="button"
                onClick={() => quitarModificador(i)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Sin modificadores</p>
      )}
    </div>
  );
}
