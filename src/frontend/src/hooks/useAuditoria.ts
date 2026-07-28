import { useState, useEffect, useCallback } from 'react';
import { getAuditoria } from '../api/auditoria';
import type { AuditoriaListOut, AuditoriaFiltros } from '../api/auditoria';
import { ApiError } from '../api/client';

export function useAuditoria(initialFiltros?: AuditoriaFiltros) {
  const [data, setData] = useState<AuditoriaListOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<AuditoriaFiltros>(initialFiltros || {});

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAuditoria(filtros);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage);
      } else {
        setError('Error al cargar bitácora');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateFiltros = useCallback((nuevosFiltros: AuditoriaFiltros) => {
    setFiltros((prev) => ({ ...prev, ...nuevosFiltros }));
  }, []);

  return { data, isLoading, error, refetch: fetch, filtros, updateFiltros };
}
