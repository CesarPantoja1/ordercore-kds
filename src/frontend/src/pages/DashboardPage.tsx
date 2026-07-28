import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ChefHat, Users, Building2 } from 'lucide-react';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-slate-500">No se pudo cargar la información del usuario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bienvenido, {user.nombre}
        </p>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Rol</p>
              <p className="text-sm font-semibold text-slate-900">
                {roleLabels[user.rol] || user.rol}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Estación</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                stationColors[user.estacion] || 'bg-slate-100 text-slate-800'
              }`}>
                {user.estacion}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Email</p>
              <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific welcome */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Panel de {roleLabels[user.rol] || 'Usuario'}
            </h2>
            <p className="text-sm text-slate-500">
              Estación: {user.estacion}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            {user.rol === 'jefe_cocina' && 'Tienes acceso completo a la gestión de usuarios y configuración del sistema.'}
            {user.rol === 'gerente' && 'Tienes acceso a la gestión de usuarios y reportes administrativos.'}
            {user.rol === 'cocinero' && `Tu estación activa es ${user.estacion}. Aquí verás las órdenes entrantes.`}
          </p>
        </div>
      </div>

      {/* Quick actions for admins */}
      {(user.rol === 'jefe_cocina' || user.rol === 'gerente') && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">
            Acciones rápidas
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/usuarios')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl shadow-sm hover:bg-blue-50 transition-all text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Gestionar usuarios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
