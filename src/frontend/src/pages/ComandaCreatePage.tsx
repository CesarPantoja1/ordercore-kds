import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ComandaForm from '../components/comandas/ComandaForm';
import { useCreateComanda } from '../hooks/useComandas';

export default function ComandaCreatePage() {
  const navigate = useNavigate();
  const { create, isSubmitting, submitError } = useCreateComanda();

  const handleSubmit = async (data: {
    mesa: number;
    comensales: number;
    platos: { catalogo_plato_id: number }[];
    notas_cocina?: string;
    prioridad: 'Normal' | 'Alta' | 'Urgente';
  }) => {
    const result = await create({
      mesa: data.mesa,
      comensales: data.comensales,
      platos: data.platos.map((p) => ({ catalogo_plato_id: p.catalogo_plato_id })),
      notas_cocina: data.notas_cocina,
      prioridad: data.prioridad,
    });

    if (result) {
      navigate(`/comandas/${result.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/comandas')}
          className="text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva comanda</h1>
          <p className="text-sm text-slate-500 mt-0.5">Crear una nueva orden para la cocina</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <ComandaForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/comandas')}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
