import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import MesaField from './MesaField';
import ComensalesField from './ComensalesField';
import SelectorPlatos from './SelectorPlatos';
import NotasField from './NotasField';
import { useCatalogo } from '../../hooks/useCatalogo';
import type { CatalogoPlatoOut } from '../../api/catalogo';
import type { Prioridad } from '../../api/comandas';

interface ComandaFormProps {
  onSubmit: (data: {
    mesa: number;
    comensales: number;
    platos: { catalogo_plato_id: number }[];
    notas_cocina?: string;
    prioridad: Prioridad;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export default function ComandaForm({ onSubmit, onCancel, isSubmitting, submitError }: ComandaFormProps) {
  const navigate = useNavigate();
  const { platos, isLoading, error: catalogoError } = useCatalogo();
  const [mesa, setMesa] = useState(0);
  const [comensales, setComensales] = useState(1);
  const [platosSeleccionados, setPlatosSeleccionados] = useState<CatalogoPlatoOut[]>([]);
  const [notasCocina, setNotasCocina] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad>('Normal');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!mesa || mesa <= 0) {
      nuevosErrores.mesa = 'El número de mesa es requerido';
    }
    if (platosSeleccionados.length === 0) {
      nuevosErrores.platos = 'Debe seleccionar al menos un plato';
    }
    if (!comensales || comensales <= 0) {
      nuevosErrores.comensales = 'Debe indicar al menos 1 comensal';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      mesa,
      comensales,
      platos: platosSeleccionados.map((p) => ({ catalogo_plato_id: p.id })),
      notas_cocina: notasCocina || undefined,
      prioridad,
    });
  };

  if (catalogoError) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">{catalogoError}</p>
          <button
            type="button"
            onClick={() => navigate('/comandas')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Volver al tablero
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mesa y Comensales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MesaField
          value={mesa}
          onChange={setMesa}
          error={errores.mesa}
        />
        <ComensalesField
          value={comensales}
          onChange={setComensales}
          error={errores.comensales}
        />
      </div>

      {/* Prioridad */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Prioridad</label>
        <div className="flex gap-2">
          {(['Normal', 'Alta', 'Urgente'] as Prioridad[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrioridad(p)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                prioridad === p
                  ? p === 'Urgente'
                    ? 'bg-red-600 text-white shadow-sm'
                    : p === 'Alta'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Platos */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando platos...
        </div>
      ) : (
        <div>
          <SelectorPlatos
            platos={platos}
            seleccionados={platosSeleccionados}
            onSelect={setPlatosSeleccionados}
          />
          {errores.platos && <p className="text-xs text-red-500 mt-1">{errores.platos}</p>}
        </div>
      )}

      {/* Notas */}
      <NotasField
        value={notasCocina}
        onChange={setNotasCocina}
        label="Notas de cocina"
      />

      {/* Submit error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear comanda
        </button>
      </div>
    </form>
  );
}
