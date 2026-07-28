import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 hover:text-red-600 transition-all"
    >
      <LogOut className="w-4 h-4" />
      Cerrar sesión
    </button>
  );
}
