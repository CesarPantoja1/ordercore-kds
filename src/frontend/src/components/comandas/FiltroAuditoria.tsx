import type { AuditoriaFiltros } from '../../api/auditoria';

interface FiltroAuditoriaProps {
  filtros: AuditoriaFiltros;
  onFilter: (filtros: AuditoriaFiltros) => void;
}

export default function FiltroAuditoria({ filtros, onFilter }: FiltroAuditoriaProps) {
  const handleChange = (key: keyof AuditoriaFiltros, value: string | number | undefined) => {
    onFilter({ ...filtros, [key]: value || undefined });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fecha desde</label>
          <input
            type="date"
            value={filtros.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value || undefined)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fecha hasta</label>
          <input
            type="date"
            value={filtros.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value || undefined)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Comanda ID</label>
          <input
            type="number"
            min={1}
            value={filtros.comanda_id || ''}
            onChange={(e) => handleChange('comanda_id', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ID"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Usuario</label>
          <input
            type="text"
            value={filtros.usuario || ''}
            onChange={(e) => handleChange('usuario', e.target.value || undefined)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de usuario"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Operación</label>
          <select
            value={filtros.tipo_operacion || ''}
            onChange={(e) => handleChange('tipo_operacion', e.target.value || undefined)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas</option>
            <option value="Creación">Creación</option>
            <option value="Modificación">Modificación</option>
            <option value="Cancelación">Cancelación</option>
          </select>
        </div>
      </div>
    </div>
  );
}
