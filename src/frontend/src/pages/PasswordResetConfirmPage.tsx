import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../api/auth';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import type { ApiError } from '../api/client';

export default function PasswordResetConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      setChecking(false);
      return;
    }
    verifyResetToken(token)
      .then((res) => {
        setValidToken(res.valid);
        setChecking(false);
      })
      .catch(() => {
        setValidToken(false);
        setChecking(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: token!, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'INVALID_OR_EXPIRED_TOKEN') {
        setError('El token es inválido o ha expirado.');
      } else if (apiErr.code === 'WEAK_PASSWORD') {
        setError('La contraseña no cumple con los requisitos de seguridad.');
      } else {
        setError(apiErr.detail || 'Error al restablecer la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Validando token...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-red-400 mb-4 flex justify-center">
            <AlertCircle className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Token inválido o expirado
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            El enlace para restablecer tu contraseña ya no es válido. Solicita uno nuevo.
          </p>
          <Link
            to="/recuperar-contrasena"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-green-500 mb-4 flex justify-center">
            <CheckCircle className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Contraseña actualizada
          </h2>
          <p className="text-sm text-slate-500">
            Redirigiendo al inicio de sesión...
          </p>
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
            Nueva contraseña
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Ingresa tu nueva contraseña
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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
                autoComplete="off"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              placeholder="Repite la contraseña"
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
              <KeyRound className="w-5 h-5" />
            )}
            {loading ? 'Actualizando...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
