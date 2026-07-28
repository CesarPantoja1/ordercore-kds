import { useState, useEffect, useCallback } from 'react';
import { getCatalogoPlatos } from '../api/catalogo';
import type { CatalogoPlatoOut, CatalogoFiltros } from '../api/catalogo';
import { ApiError } from '../api/client';

export function useCatalogo(initialFiltros?: CatalogoFiltros) {
  const [platos, setPlatos] = useState<CatalogoPlatoOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<CatalogoFiltros>(initialFiltros || {});

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCatalogoPlatos(filtros);
      setPlatos(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage);
      } else {
        setError('Error al cargar catálogo');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateFiltros = useCallback((nuevosFiltros: CatalogoFiltros) => {
    setFiltros((prev) => ({ ...prev, ...nuevosFiltros }));
  }, []);

  return { platos, isLoading, error, refetch: fetch, filtros, updateFiltros };
}
