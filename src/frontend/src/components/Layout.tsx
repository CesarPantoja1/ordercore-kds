import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoutButton from './LogoutButton';
import SessionTimeoutWarning from './SessionTimeoutWarning';

export default function Layout() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'jefe_cocina' || user?.rol === 'gerente';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">OC</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                OrderCore KDS
              </span>
            </NavLink>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              {isAdmin && (
                <NavLink to="/usuarios" className={linkClass}>
                  <Users className="w-4 h-4" />
                  Usuarios
                </NavLink>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-slate-500 hidden sm:block">
                  {user.nombre}
                </span>
              )}
              <LogoutButton />
            </div>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-1 pb-3">
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>
            {isAdmin && (
              <NavLink to="/usuarios" className={linkClass}>
                <Users className="w-4 h-4" />
                Usuarios
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <SessionTimeoutWarning />
    </div>
  );
}
