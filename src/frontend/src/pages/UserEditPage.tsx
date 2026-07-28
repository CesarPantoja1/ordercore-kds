import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getUser, updateUser } from '../api/usuarios';
import { ApiError } from '../api/client';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const ROLES = [
  { value: 'jefe_cocina', label: 'Jefe de Cocina' },
  { value: 'cocinero', label: 'Cocinero' },
  { value: 'gerente', label: 'Gerente' },
];

const ESTACIONES = ['Parrilla', 'Fríos', 'Bebidas', 'Postres', 'Todas'];

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('cocinero');
  const [estacion, setEstacion] = useState('Todas');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      try {
        const user = await getUser(Number(id));
        setNombre(user.nombre);
        setEmail(user.email);
        setRol(user.rol);
        setEstacion(user.estacion);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setFetchError('Usuario no encontrado');
          } else {
            setFetchError(err.humanMessage || 'Error al cargar usuario');
          }
        } else {
          setFetchError('Error de conexión');
        }
      } finally {
        setFetchLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Formato de email inválido';
    }
    if (password && password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await updateUser(Number(id), {
        nombre: nombre.trim(),
        email: email.trim(),
        password: password || undefined,
        rol,
        estacion,
      });
      navigate('/usuarios');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Usuario no encontrado');
        } else if (err.status === 409) {
          setError('El email ya está registrado por otro usuario');
        } else {
          setError(err.humanMessage || 'Error al actualizar el usuario');
        }
      } else {
        setError('Error de conexión. Verifica el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <LoadingState message="Cargando datos del usuario..." />;
  }

  if (fetchError) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a usuarios
        </button>
        <ErrorState message={fetchError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/usuarios')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a usuarios
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Editar usuario</h1>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl border ${
                  fieldErrors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="Nombre del usuario"
                disabled={loading}
              />
              {fieldErrors.nombre && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.nombre}</p>
              )}
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
                className={`w-full px-4 py-2.5 rounded-2xl border ${
                  fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="email@ejemplo.com"
                disabled={loading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Nueva contraseña <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 rounded-2xl border ${
                    fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Dejar vacío para mantener"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-slate-700 mb-1">
                Rol
              </label>
              <select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estación
              </label>
              <div className="flex flex-wrap gap-2">
                {ESTACIONES.map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setEstacion(est)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      estacion === est
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/usuarios')}
              disabled={loading}
              className="px-6 py-2.5 text-slate-600 font-medium rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
