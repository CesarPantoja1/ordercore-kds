interface NotasFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function NotasField({ value, onChange, label }: NotasFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        placeholder="Escribe notas aquí..."
      />
    </div>
  );
}
