import { request } from './client';

export interface CatalogoPlatoOut {
  id: number;
  nombre: string;
  estacion: string;
  descripcion?: string;
  activo: boolean;
}

export interface CatalogoFiltros {
  estacion?: string;
  search?: string;
}

const PREFIX = '/gestion_de_comandas_ordenes_e_items';

export function getCatalogoPlatos(params?: CatalogoFiltros): Promise<CatalogoPlatoOut[]> {
  return request<CatalogoPlatoOut[]>(`${PREFIX}/catalogo/platos`, {
    params: params as Record<string, string | number | undefined>,
  });
}
