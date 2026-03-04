/**
 * useAsync — Hook genérico para operaciones asíncronas
 * Elimina la repetición de [data, loading, error] + useEffect en cada hook.
 *
 * Uso:
 *   const { data, loading, error, refresh } = useAsync(() => fetchSomething());
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
  /** Vuelve a ejecutar la función asíncrona manualmente */
  refresh: () => Promise<T | null>;
}

/**
 * @param asyncFn  Función que devuelve una Promise. Debe ser estable (usar useCallback
 *                 en el llamador si tiene dependencias).
 * @param deps     Dependencias que, al cambiar, re-ejecutan `asyncFn` automáticamente.
 *                 Equivale a las dependencias del useEffect interno.
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Ref para ignorar respuestas de llamadas canceladas (cleanup)
  const isMountedRef = useRef(true);

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await asyncFn();
      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error: message }));
      }
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMountedRef.current = true;
    execute();
    return () => {
      isMountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { ...state, refresh: execute };
}
