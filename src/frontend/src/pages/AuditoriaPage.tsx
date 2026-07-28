import { Clock } from 'lucide-react';
import AuditLogTable from '../components/comandas/AuditLogTable';
import FiltroAuditoria from '../components/comandas/FiltroAuditoria';
import { useAuditoria } from '../hooks/useAuditoria';
import type { AuditoriaFiltros } from '../api/auditoria';

export default function AuditoriaPage() {
  const { data, isLoading, error, refetch, filtros, updateFiltros } = useAuditoria();

  const handleFilter = (nuevosFiltros: AuditoriaFiltros) => {
    updateFiltros({ ...nuevosFiltros, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateFiltros({ ...filtros, page });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bitácora de auditoría</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historial de operaciones realizadas en el sistema de comandas
          </p>
        </div>
      </div>

      <FiltroAuditoria
        filtros={filtros}
        onFilter={handleFilter}
      />

      <AuditLogTable
        entries={data?.entries || []}
        isLoading={isLoading}
        error={error}
        totalPages={data ? Math.ceil(data.total / data.page_size) : 1}
        currentPage={data?.page || 1}
        onPageChange={handlePageChange}
        onRetry={refetch}
      />
    </div>
  );
}
