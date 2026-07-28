import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, deactivateUser, reactivateUser } from '../api/usuarios';
import type { UserOut, PaginatedUsers } from '../api/usuarios';
import type { ApiError } from '../api/client';
import { Plus, Search, ChevronLeft, ChevronRight, UserX, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const roleLabels: Record<string, string> = {
  jefe_cocina: 'Jefe de Cocina',
  cocinero: 'Cocinero',
  gerente: 'Gerente',
};

const stationColors: Record<string, string> = {
  Parrilla: 'bg-orange-100 text-orange-800',
  Fríos: 'bg-blue-100 text-blue-800',
  Bebidas: 'bg-cyan-100 text-cyan-800',
  Postres: 'bg-pink-100 text-pink-800',
  Todas: 'bg-purple-100 text-purple-800',
};

export default function UserListPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers({ search: search || undefined, page, page_size: pageSize });
      setData(res);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setError('');
    try {
      const res = await listUsers({ search: search || undefined, page: 1, page_size: pageSize });
      setData(res);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserOut) => {
    if (togglingId) return;
    setTogglingId(user.id);
    try {
      if (user.activo) {
        await deactivateUser(user.id);
      } else {
        await reactivateUser(user.id);
      }
      fetchUsers();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || 'Error al cambiar estado del usuario.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-900 bg-white transition-all"
        />
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" count={5} />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          title="No hay usuarios"
          description={search ? 'No se encontraron usuarios con ese criterio de búsqueda.' : 'Aún no hay usuarios registrados en el sistema.'}
          actionLabel={search ? undefined : 'Crear primer usuario'}
          onAction={search ? undefined : () => navigate('/usuarios/nuevo')}
        />
      )}

      {/* Table */}
      {!loading && !error && data && data.items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estación</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {user.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {roleLabels[user.rol] || user.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        stationColors[user.estacion] || 'bg-slate-100 text-slate-800'
                      }`}>
                        {user.estacion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/usuarios/${user.id}/editar`)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={togglingId === user.id}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            user.activo
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          } disabled:opacity-50`}
                        >
                          {togglingId === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.activo ? (
                            <UserX className="w-3 h-3" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          {user.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500">
                Mostrando {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, data.total)} de {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600 font-medium">
                  {page} / {data.total_pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page >= data.total_pages}
                  className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state (full) */}
      {!loading && error && !data && (
        <ErrorState
          message={error}
          onRetry={fetchUsers}
        />
      )}
    </div>
  );
}
