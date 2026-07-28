import { useState, useEffect, useCallback } from 'react';
import { listComandas, getComanda, createComanda, updateComanda, cancelComanda, cancelPlato } from '../api/comandas';
import type { ComandaResumenOut, ComandaOut, ComandaCreate, ComandaUpdate, CancelRequest } from '../api/comandas';
import { ApiError } from '../api/client';

export function useComandasList(params?: { estacion?: string }) {
  const [comandas, setComandas] = useState<ComandaResumenOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listComandas(params);
      setComandas(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage);
      } else {
        setError('Error al cargar comandas');
      }
    } finally {
      setIsLoading(false);
    }
  }, [params?.estacion]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { comandas, isLoading, error, refetch: fetch };
}

export function useComanda(id: number | null) {
  const [comanda, setComanda] = useState<ComandaOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (id === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getComanda(id);
      setComanda(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.humanMessage);
      } else {
        setError('Error al cargar comanda');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { comanda, isLoading, error, refetch: fetch, setComanda };
}

export function useCreateComanda() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const create = useCallback(async (data: ComandaCreate): Promise<ComandaOut | null> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createComanda(data);
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.humanMessage);
      } else {
        setSubmitError('Error al crear comanda');
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { create, isSubmitting, submitError, setSubmitError };
}

export function useUpdateComanda() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = useCallback(async (id: number, data: ComandaUpdate): Promise<ComandaOut | null> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await updateComanda(id, data);
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.humanMessage);
      } else {
        setSubmitError('Error al actualizar comanda');
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { update, isSubmitting, submitError, setSubmitError };
}

export function useCancelComanda() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cancel = useCallback(async (id: number, data: CancelRequest): Promise<ComandaOut | null> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await cancelComanda(id, data);
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.humanMessage);
      } else {
        setSubmitError('Error al cancelar comanda');
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { cancel, isSubmitting, submitError, setSubmitError };
}

export function useCancelPlato() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cancel = useCallback(async (comandaId: number, platoId: number, data: CancelRequest): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await cancelPlato(comandaId, platoId, data);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.humanMessage);
      } else {
        setSubmitError('Error al cancelar plato');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { cancel, isSubmitting, submitError, setSubmitError };
}
