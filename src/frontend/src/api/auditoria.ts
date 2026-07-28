import { request } from './client';

export type TipoOperacion = 'Creación' | 'Modificación' | 'Cancelación';

export interface AuditoriaOut {
  id: number;
  timestamp: string;
  usuario_nombre: string;
  usuario_rol: string;
  tipo_operacion: TipoOperacion;
  comanda_id: number;
  plato_id?: number;
  estado_anterior?: string;
  estado_nuevo: string;
  motivo?: string;
}

export interface AuditoriaListOut {
  total: number;
  page: number;
  page_size: number;
  entries: AuditoriaOut[];
}

export interface AuditoriaFiltros {
  date_from?: string;
  date_to?: string;
  comanda_id?: number;
  usuario?: string;
  tipo_operacion?: string;
  page?: number;
  page_size?: number;
}

const PREFIX = '/gestion_de_comandas_ordenes_e_items';

export function getAuditoria(params?: AuditoriaFiltros): Promise<AuditoriaListOut> {
  return request<AuditoriaListOut>(`${PREFIX}/auditoria`, {
    params: params as Record<string, string | number | undefined>,
  });
}
