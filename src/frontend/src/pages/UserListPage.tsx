import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, UserX, UserCheck, AlertCircle } from 'lucide-react';
import { listUsers, deactivateUser, reactivateUser } from '../api/usuarios';
import { ApiError } from '../api/client';
import type { UserOut } from '../api/auth';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

function UserSearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch(e.target.value);
        }}
        placeholder="Buscar por nombre o email..."
        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Anterior
      </button>
      <span className="text-sm text-slate-500 px-2">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Siguiente
      </button>
    </div>
  );
}

function UserTable({
  users,
  onEdit,
  onToggleActive,
  togglingId,
}: {
  users: UserOut[];
  onEdit: (id: number) => void;
  onToggleActive: (id: number, currentActive: boolean) => void;
  togglingId: number | null;
}) {
  const roleLabels: Record<string, string> = {
    jefe_cocina: 'Jefe de Cocina',
    cocinero: 'Cocinero',
    gerente: 'Gerente',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500">Nombre</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Rol</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Estación</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-800">{user.nombre}</td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className="capitalize text-slate-600">
                  {roleLabels[user.rol] || user.rol}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-600">{user.estacion}</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.activo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(user.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Editar usuario"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleActive(user.id, user.activo)}
                    disabled={togglingId === user.id}
                    className={`p-2 rounded-xl transition-all ${
                      user.activo
                        ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                    } disabled:opacity-50`}
                    title={user.activo ? 'Desactivar usuario' : 'Reactivar usuario'}
                  >
                    {user.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers({ search: search || undefined, page, page_size: 10 });
      setUsers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage || 'Error al cargar usuarios');
      } else {
        setError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    setTogglingId(id);
    try {
      if (currentActive) {
        await deactivateUser(id);
      } else {
        await reactivateUser(id);
      }
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage || 'Error al cambiar estado');
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestión de usuarios'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/usuarios/nuevo')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <UserSearchBar onSearch={handleSearch} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState message="Cargando usuarios..." />
      ) : error && users.length === 0 ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No hay usuarios registrados"
          description={search ? 'No se encontraron usuarios con ese criterio de búsqueda' : 'Crea el primer usuario del sistema'}
          actionLabel={search ? undefined : 'Nuevo usuario'}
          onAction={search ? undefined : () => navigate('/usuarios/nuevo')}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <UserTable
            users={users}
            onEdit={(id) => navigate(`/usuarios/${id}/editar`)}
            onToggleActive={handleToggleActive}
            togglingId={togglingId}
          />
          <div className="p-4 border-t border-slate-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
