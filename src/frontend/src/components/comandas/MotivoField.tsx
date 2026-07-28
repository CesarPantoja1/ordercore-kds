interface MotivoFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function MotivoField({ value, onChange, error }: MotivoFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Motivo de cancelación <span className="text-red-500">*</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
        }`}
        placeholder="Describe el motivo (mínimo 10 caracteres)..."
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-1">
        {value.length}/10 caracteres mínimos
      </p>
    </div>
  );
}
