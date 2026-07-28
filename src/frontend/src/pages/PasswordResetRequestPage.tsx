import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../api/auth';
import { Loader2, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import type { ApiError } from '../api/client';

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor ingresa tu email.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.detail || 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-green-500 mb-4 flex justify-center">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Solicitud enviada
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm"
          >
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
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">OC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Ingresa tu email para recibir instrucciones
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              placeholder="tu@email.com"
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
