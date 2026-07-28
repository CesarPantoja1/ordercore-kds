interface ComensalesFieldProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
}

export default function ComensalesField({ value, onChange, disabled, error }: ComensalesFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Comensales <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        min={1}
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        disabled={disabled}
        className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
        placeholder="Cantidad de comensales"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
