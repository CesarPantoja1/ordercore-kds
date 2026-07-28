import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api/auth';

export default function LogoutButton() {
  const { logoutAction } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore server errors on logout
    }
    logoutAction();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
      title="Cerrar sesión"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}
