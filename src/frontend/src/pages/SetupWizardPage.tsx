import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSetup } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { ApiError } from '../api/client';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { refreshSetupStatus } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = (): string | null => {
    if (!nombre.trim() || nombre.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }
    if (!email.trim()) {
      return 'El email es obligatorio.';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return 'El formato del email no es válido.';
    }
    if (!password || password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await completeSetup({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setSuccess(true);
      // After setup, refresh auth state to reflect setup_completed
      await refreshSetupStatus();
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'SETUP_ALREADY_COMPLETED') {
        navigate('/login', { replace: true });
        return;
      }
      setError(apiErr.detail || 'Error al crear la cuenta de administrador.');
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
            ¡Cuenta creada!
          </h2>
          <p className="text-slate-500">
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
            OrderCore KDS
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Configuración inicial del sistema
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Crea la cuenta de administrador maestro
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
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del administrador
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              placeholder="Tu nombre"
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>

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
              placeholder="admin@ejemplo.com"
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
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
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Creando cuenta...' : 'Crear cuenta de administrador'}
          </button>
        </form>
      </div>
    </div>
  );
}
