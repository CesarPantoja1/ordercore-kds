import { Link } from 'react-router-dom';
import { ChefHat, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <ChefHat className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">
          Página no encontrada
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-sm">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-2xl shadow-sm hover:bg-blue-700 transition-all"
        >
          <Home className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
