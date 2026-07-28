import { request } from './client';
import type { UserOut } from './auth';
export type { UserOut };

const PREFIX = '/autenticacion_y_gestion_de_usuarios';

// --- Interfaces ---

export interface UserCreate {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  estacion: string;
}

export interface UserUpdate {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
  estacion?: string;
}

export interface PaginatedUsers {
  items: UserOut[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserActionResponse {
  message: string;
  user_id: number;
}

// --- Endpoint Functions ---

export async function listUsers(params: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedUsers> {
  return request<PaginatedUsers>(
    `${PREFIX}/usuarios`,
    {
      method: 'GET',
      params: {
        search: params.search,
        page: params.page,
        page_size: params.page_size,
      },
      auth: true,
    }
  );
}

export async function getUser(id: number): Promise<UserOut> {
  return request<UserOut>(
    `${PREFIX}/usuarios/${id}`,
    { method: 'GET', auth: true }
  );
}

export async function createUser(data: UserCreate): Promise<UserOut> {
  return request<UserOut>(
    `${PREFIX}/usuarios`,
    { method: 'POST', body: data, auth: true }
  );
}

export async function updateUser(id: number, data: UserUpdate): Promise<UserOut> {
  return request<UserOut>(
    `${PREFIX}/usuarios/${id}`,
    { method: 'PATCH', body: data, auth: true }
  );
}

export async function deactivateUser(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(
    `${PREFIX}/usuarios/${id}/deactivate`,
    { method: 'PATCH', auth: true }
  );
}

export async function reactivateUser(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(
    `${PREFIX}/usuarios/${id}/reactivate`,
    { method: 'PATCH', auth: true }
  );
}
