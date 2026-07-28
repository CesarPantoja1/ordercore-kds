import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUser } from '../api/usuarios';
import type { ApiError } from '../api/client';
import { Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';

const ROLES = [
  { value: 'jefe_cocina', label: 'Jefe de Cocina' },
  { value: 'cocinero', label: 'Cocinero' },
  { value: 'gerente', label: 'Gerente' },
];

const ESTACIONES = [
  'Parrilla',
  'Fríos',
  'Bebidas',
  'Postres',
  'Todas',
];

export default function UserCreatePage() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('cocinero');
  const [estacion, setEstacion] = useState('Todas');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string | null => {
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
    if (!rol) {
      return 'Debes seleccionar un rol.';
    }
    if (!estacion) {
      return 'Debes seleccionar una estación.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await createUser({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
        estacion,
      });
      navigate('/usuarios');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'EMAIL_EXISTS') {
        setError('Ya existe un usuario con ese email.');
      } else {
        setError(apiErr.detail || 'Error al crear el usuario.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/usuarios"
          className="p-2 rounded-xl hover:bg-slate-200 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea un nuevo usuario en el sistema
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              placeholder="Nombre del usuario"
              disabled={loading}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              placeholder="email@ejemplo.com"
              disabled={loading}
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
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              placeholder="Repite la contraseña"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-slate-700 mb-1">
              Rol
            </label>
            <select
              id="rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              disabled={loading}
              required
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="estacion" className="block text-sm font-medium text-slate-700 mb-1">
              Estación
            </label>
            <select
              id="estacion"
              value={estacion}
              onChange={(e) => setEstacion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white transition-all"
              disabled={loading}
              required
            >
              {ESTACIONES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
          <Link
            to="/usuarios"
            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
