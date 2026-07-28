import { useAuth } from '../context/AuthContext';
import { ChefHat, Users, ClipboardList, Utensils } from 'lucide-react';

function StationFilter({ estacion }: { estacion: string }) {
  const stationColors: Record<string, string> = {
    Parrilla: 'bg-orange-100 text-orange-700 border-orange-200',
    Fríos: 'bg-blue-100 text-blue-700 border-blue-200',
    Bebidas: 'bg-purple-100 text-purple-700 border-purple-200',
    Postres: 'bg-pink-100 text-pink-700 border-pink-200',
    Todas: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border ${
        stationColors[estacion] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      <Utensils className="w-3.5 h-3.5" />
      {estacion}
    </span>
  );
}

function RoleDashboard({ user }: { user: { nombre: string; rol: string; estacion: string } }) {
  const roleLabels: Record<string, string> = {
    jefe_cocina: 'Jefe de Cocina',
    cocinero: 'Cocinero',
    gerente: 'Gerente',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            ¡Bienvenido, {user.nombre}!
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 capitalize">
              {roleLabels[user.rol] || user.rol}
            </span>
            <StationFilter estacion={user.estacion} />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500">Órdenes pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500">En preparación</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-500">Equipo activo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for order list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Órdenes activas
        </h3>
        <div className="text-center py-12 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay órdenes activas en este momento</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ChefHat className="w-10 h-10 text-blue-600 animate-pulse" />
      </div>
    );
  }

  return <RoleDashboard user={user} />;
}
