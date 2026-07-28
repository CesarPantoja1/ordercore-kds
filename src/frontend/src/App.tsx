import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import LoadingState from './components/LoadingState';
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import DashboardPage from './pages/DashboardPage';
import UserListPage from './pages/UserListPage';
import UserCreatePage from './pages/UserCreatePage';
import UserEditPage from './pages/UserEditPage';
import NotFoundPage from './pages/NotFoundPage';

function RootRedirect() {
  const { isAuthLoading, setupCompleted, isAuthenticated } = useAuth();

  if (isAuthLoading) {
    return <LoadingState message="Cargando..." />;
  }

  if (setupCompleted === false) {
    return <Navigate to="/setup-wizard" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public routes (no auth needed) */}
      <Route
        path="/setup-wizard"
        element={
          <PublicRoute>
            <SetupWizardPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/recuperar-contrasena"
        element={
          <PublicRoute>
            <PasswordResetRequestPage />
          </PublicRoute>
        }
      />
      <Route
        path="/restablecer-contrasena"
        element={
          <PublicRoute>
            <PasswordResetConfirmPage />
          </PublicRoute>
        }
      />

      {/* Protected routes (auth required) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={['jefe_cocina', 'gerente']}>
            <Layout>
              <UserListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/nuevo"
        element={
          <ProtectedRoute allowedRoles={['jefe_cocina', 'gerente']}>
            <Layout>
              <UserCreatePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/:id/editar"
        element={
          <ProtectedRoute allowedRoles={['jefe_cocina', 'gerente']}>
            <Layout>
              <UserEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <AppRoutes />
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
