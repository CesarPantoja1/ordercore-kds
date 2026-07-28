import { request } from './client';

export type Prioridad = 'Normal' | 'Alta' | 'Urgente';
export type EstadoPlato = 'En cola' | 'En preparación' | 'Completado' | 'Cancelado';
export type EstadoComanda = 'Activa' | 'Cancelada';

export interface PlatoCreate {
  catalogo_plato_id: number;
  modificadores?: string[];
  notas?: string;
}

export interface PlatoUpdate {
  id?: number | null;
  catalogo_plato_id: number;
  modificadores?: string[];
  notas?: string;
}

export interface ComandaCreate {
  mesa: number;
  comensales: number;
  platos: PlatoCreate[];
  notas_cocina?: string;
  prioridad?: Prioridad;
}

export interface ComandaUpdate {
  mesa?: number;
  comensales?: number;
  platos?: PlatoUpdate[];
  notas_cocina?: string;
  prioridad?: Prioridad;
}

export interface CancelRequest {
  motivo: string;
}

export interface PlatoComandaOut {
  id: number;
  catalogo_plato_id: number;
  nombre_plato: string;
  estacion: string;
  estado: EstadoPlato;
  modificadores: string[];
  notas?: string;
  fecha_creacion: string;
}

export interface ComandaOut {
  id: number;
  mesa: number;
  comensales: number;
  platos: PlatoComandaOut[];
  notas_cocina?: string;
  prioridad: Prioridad;
  estado: EstadoComanda;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface ComandaResumenOut {
  id: number;
  mesa: number;
  comensales: number;
  platos_count: number;
  platos_activos: number;
  prioridad: Prioridad;
  estado: EstadoComanda;
  tiempo_transcurrido: string;
  fecha_creacion: string;
}

const PREFIX = '/gestion_de_comandas_ordenes_e_items';

export function createComanda(data: ComandaCreate): Promise<ComandaOut> {
  return request<ComandaOut>(`${PREFIX}/`, {
    method: 'POST',
    body: data,
  });
}

export function listComandas(params?: {
  estacion?: string;
}): Promise<ComandaResumenOut[]> {
  return request<ComandaResumenOut[]>(`${PREFIX}/`, {
    params: params as Record<string, string | number | undefined>,
  });
}

export function getComanda(comandaId: number): Promise<ComandaOut> {
  return request<ComandaOut>(`${PREFIX}/${comandaId}`);
}

export function updateComanda(comandaId: number, data: ComandaUpdate): Promise<ComandaOut> {
  return request<ComandaOut>(`${PREFIX}/${comandaId}`, {
    method: 'PUT',
    body: data,
  });
}

export function cancelComanda(comandaId: number, data: CancelRequest): Promise<ComandaOut> {
  return request<ComandaOut>(`${PREFIX}/${comandaId}/cancel`, {
    method: 'PATCH',
    body: data,
  });
}

export function cancelPlato(comandaId: number, platoId: number, data: CancelRequest): Promise<PlatoComandaOut> {
  return request<PlatoComandaOut>(`${PREFIX}/${comandaId}/platos/${platoId}/cancel`, {
    method: 'PATCH',
    body: data,
  });
}
