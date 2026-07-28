import { request } from './client';

const PREFIX = '/autenticacion_y_gestion_de_usuarios';

// --- Interfaces ---

export interface SetupStatusResponse {
  setup_completed: boolean;
}

export interface SetupCompleteRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface UserOut {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estacion: string;
  activo: boolean;
}

export interface SetupCompleteResponse {
  message: string;
  user: UserOut;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: UserOut;
}

export interface LogoutResponse {
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface ResetTokenStatus {
  valid: boolean;
  email?: string | null;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface SessionConfigResponse {
  timeout_minutes: number;
}

export interface SessionConfigUpdate {
  timeout_minutes: number;
}

// --- Endpoint Functions ---

export async function setupStatus(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>(
    `${PREFIX}/auth/setup/status`,
    { method: 'GET' }
  );
}

export async function completeSetup(data: SetupCompleteRequest): Promise<SetupCompleteResponse> {
  return request<SetupCompleteResponse>(
    `${PREFIX}/auth/setup/complete`,
    { method: 'POST', body: data }
  );
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>(
    `${PREFIX}/auth/login`,
    { method: 'POST', body: data }
  );
}

export async function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>(
    `${PREFIX}/auth/logout`,
    { method: 'POST', auth: true }
  );
}

export async function getCurrentUser(): Promise<UserOut> {
  return request<UserOut>(
    `${PREFIX}/auth/me`,
    { method: 'GET', auth: true }
  );
}

export async function refreshSession(): Promise<LoginResponse> {
  return request<LoginResponse>(
    `${PREFIX}/auth/session/refresh`,
    { method: 'POST', auth: true }
  );
}

export async function getSessionConfig(): Promise<SessionConfigResponse> {
  return request<SessionConfigResponse>(
    `${PREFIX}/auth/session/config`,
    { method: 'GET', auth: true }
  );
}

export async function updateSessionConfig(data: SessionConfigUpdate): Promise<SessionConfigResponse> {
  return request<SessionConfigResponse>(
    `${PREFIX}/auth/session/config`,
    { method: 'PATCH', body: data, auth: true }
  );
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
  return request<PasswordResetResponse>(
    `${PREFIX}/auth/recuperar`,
    { method: 'POST', body: data }
  );
}

export async function verifyResetToken(token: string): Promise<ResetTokenStatus> {
  return request<ResetTokenStatus>(
    `${PREFIX}/auth/restablecer/${encodeURIComponent(token)}`,
    { method: 'GET' }
  );
}

export async function resetPassword(data: PasswordResetConfirm): Promise<PasswordResetResponse> {
  return request<PasswordResetResponse>(
    `${PREFIX}/auth/restablecer`,
    { method: 'POST', body: data }
  );
}
