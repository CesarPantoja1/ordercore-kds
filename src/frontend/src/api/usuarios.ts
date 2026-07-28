import { request } from './client';
import type { UserOut } from './auth';

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

const PREFIX = '/autenticacion_y_gestion_de_usuarios';

export function listUsers(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedUsers> {
  return request<PaginatedUsers>(`${PREFIX}/usuarios`, {
    params: {
      search: params?.search,
      page: params?.page,
      page_size: params?.page_size,
    },
  });
}

export function getUser(id: number): Promise<UserOut> {
  return request<UserOut>(`${PREFIX}/usuarios/${id}`);
}

export function createUser(data: UserCreate): Promise<UserOut> {
  return request<UserOut>(`${PREFIX}/usuarios`, {
    method: 'POST',
    body: data,
  });
}

export function updateUser(id: number, data: UserUpdate): Promise<UserOut> {
  return request<UserOut>(`${PREFIX}/usuarios/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export function deactivateUser(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`${PREFIX}/usuarios/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export function reactivateUser(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`${PREFIX}/usuarios/${id}/reactivate`, {
    method: 'PATCH',
  });
}
