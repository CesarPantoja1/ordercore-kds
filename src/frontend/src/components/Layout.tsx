import { Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, ChefHat } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import LogoutButton from './LogoutButton';
import SessionTimeoutWarning from './SessionTimeoutWarning';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.rol === 'jefe_cocina' || user?.rol === 'gerente';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ path: '/usuarios', label: 'Usuarios', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <SessionTimeoutWarning />

      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                OrderCore KDS
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-2xl transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-800">{user.nombre}</p>
                  <p className="text-xs text-slate-400 capitalize">{user.rol?.replace('_', ' ')}</p>
                </div>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
