import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicRoute } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import Layout from './components/Layout';

// Pages
import SetupWizardPage from './pages/SetupWizardPage';
import LoginPage from './pages/LoginPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import DashboardPage from './pages/DashboardPage';
import UserListPage from './pages/UserListPage';
import UserCreatePage from './pages/UserCreatePage';
import UserEditPage from './pages/UserEditPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <Routes>
            {/* Public routes (no Layout) */}
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
              path="/restablecer-contrasena/:token"
              element={
                <PublicRoute>
                  <PasswordResetConfirmPage />
                </PublicRoute>
              }
            />

            {/* Authenticated routes (with Layout) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route
                path="usuarios"
                element={
                  <ProtectedRoute allowedRoles={['jefe_cocina', 'gerente']}>
                    <UserListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="usuarios/nuevo"
                element={
                  <ProtectedRoute allowedRoles={['jefe_cocina', 'gerente']}>
                    <UserCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="usuarios/:id/editar"
                element={
                  <ProtectedRoute allowedRoles={['jefe_cocina', 'gerente']}>
                    <UserEditPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
