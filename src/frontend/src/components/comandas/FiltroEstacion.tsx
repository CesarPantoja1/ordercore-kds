interface FiltroEstacionProps {
  estaciones: string[];
  seleccion: string;
  onChange: (estacion: string) => void;
}

export default function FiltroEstacion({ estaciones, seleccion, onChange }: FiltroEstacionProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
          seleccion === ''
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        Todas
      </button>
      {estaciones.map((estacion) => (
        <button
          key={estacion}
          type="button"
          onClick={() => onChange(estacion)}
          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
            seleccion === estacion
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {estacion}
        </button>
      ))}
    </div>
  );
}
