import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '../api/auth';
import { ApiError } from '../api/client';

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage || 'Error al procesar la solicitud');
      } else {
        setError('Error de conexión. Verifica el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Solicitud enviada
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">OrderCore KDS</h1>
          <p className="text-sm text-slate-500 mt-1">
            Recuperar contraseña
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-sm text-slate-600 mb-6">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
