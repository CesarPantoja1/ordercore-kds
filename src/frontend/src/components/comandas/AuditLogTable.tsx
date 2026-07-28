import { Clock } from 'lucide-react';
import type { AuditoriaOut } from '../../api/auditoria';
import Skeleton from '../Skeleton';
import EmptyState from '../EmptyState';
import ErrorState from '../ErrorState';
import Paginador from './Paginador';

interface AuditLogTableProps {
  entries: AuditoriaOut[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

const operacionColors: Record<string, string> = {
  Creación: 'bg-green-100 text-green-700',
  Modificación: 'bg-blue-100 text-blue-700',
  Cancelación: 'bg-red-100 text-red-700',
};

export default function AuditLogTable({
  entries,
  isLoading,
  error,
  totalPages,
  currentPage,
  onPageChange,
  onRetry,
}: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-16 h-16 text-slate-300" />}
        title="No se encontraron registros de auditoría"
        description="No hay entradas de bitácora para los filtros seleccionados."
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Fecha/Hora
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Usuario
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Operación
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Comanda
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Estado anterior
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Estado nuevo
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Motivo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-all">
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {formatDate(entry.timestamp)}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.usuario_nombre}</p>
                    <p className="text-xs text-slate-400">{entry.usuario_rol}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${operacionColors[entry.tipo_operacion] || 'bg-slate-100 text-slate-700'}`}>
                    {entry.tipo_operacion}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  #{entry.comanda_id}
                  {entry.plato_id && <span className="text-xs text-slate-400"> / Plato #{entry.plato_id}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {entry.estado_anterior || '—'}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <span className={`${
                    entry.estado_nuevo === 'Cancelado' || entry.estado_nuevo === 'Cancelada'
                      ? 'text-red-600'
                      : entry.estado_nuevo === 'Completado'
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}>
                    {entry.estado_nuevo}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                  {entry.motivo || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <Paginador
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={onPageChange}
        />
      </div>
    </div>
  );
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}
