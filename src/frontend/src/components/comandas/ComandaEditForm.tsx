import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import MesaField from './MesaField';
import ComensalesField from './ComensalesField';
import PlatoEditList from './PlatoEditList';
import NotasField from './NotasField';
import type { ComandaOut, Prioridad } from '../../api/comandas';
import { useAuth } from '../../context/AuthContext';

interface ComandaEditFormProps {
  comanda: ComandaOut;
  onSubmit: (data: {
    mesa?: number;
    comensales?: number;
    platos?: { id?: number | null; catalogo_plato_id: number; modificadores?: string[]; notas?: string }[];
    notas_cocina?: string;
    prioridad?: Prioridad;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export default function ComandaEditForm({
  comanda,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: ComandaEditFormProps) {
  const { user } = useAuth();
  const isJefeCocina = user?.rol === 'jefe_cocina' || user?.rol === 'gerente';

  const [mesa, setMesa] = useState(comanda.mesa);
  const [comensales, setComensales] = useState(comanda.comensales);
  const [platos, setPlatos] = useState(comanda.platos);
  const [notasCocina, setNotasCocina] = useState(comanda.notas_cocina || '');
  const [prioridad, setPrioridad] = useState<Prioridad>(comanda.prioridad);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const handleUpdatePlato = (platoId: number, cambios: { modificadores?: string[]; notas?: string }) => {
    setPlatos((prev) =>
      prev.map((p) => (p.id === platoId ? { ...p, ...cambios } : p))
    );
  };

  const handleRemovePlato = (platoId: number) => {
    setPlatos((prev) => prev.filter((p) => p.id !== platoId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores: Record<string, string> = {};

    if (!isJefeCocina && mesa !== comanda.mesa) {
      nuevosErrores.mesa = 'Solo el Jefe de Cocina puede cambiar la mesa';
    }

    if (comanda.estado !== 'Activa') {
      nuevosErrores.general = 'No se puede editar una comanda cancelada';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    onSubmit({
      mesa: isJefeCocina ? mesa : undefined,
      comensales: isJefeCocina ? comensales : undefined,
      platos: platos.map((p) => ({
        id: p.id,
        catalogo_plato_id: p.catalogo_plato_id,
        modificadores: p.modificadores,
        notas: p.notas,
      })),
      notas_cocina: notasCocina || undefined,
      prioridad,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">
          Editar comanda #{comanda.id}
        </h2>
      </div>

      {/* Header data - only editable by Jefe de Cocina */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Datos de cabecera {!isJefeCocina && <span className="text-xs text-slate-400 font-normal">(solo lectura)</span>}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MesaField
            value={mesa}
            onChange={setMesa}
            disabled={!isJefeCocina}
            error={errores.mesa}
          />
          <ComensalesField
            value={comensales}
            onChange={setComensales}
            disabled={!isJefeCocina}
          />
        </div>

        {/* Prioridad */}
        <div className="mt-4">
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
      </div>

      {/* Platos editables */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Platos</h3>
        <PlatoEditList
          platos={platos}
          onUpdate={handleUpdatePlato}
          onRemove={handleRemovePlato}
        />
      </div>

      {/* Notas */}
      <NotasField
        value={notasCocina}
        onChange={setNotasCocina}
        label="Notas de cocina"
      />

      {/* Error */}
      {errores.general && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-600">{errores.general}</p>
        </div>
      )}
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
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
