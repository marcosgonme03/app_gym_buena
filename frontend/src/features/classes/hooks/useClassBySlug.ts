import { useCallback, useEffect, useState } from 'react';
import type { GymClass } from '@/features/classes/types';
import { fetchClassBySlug } from '@/features/classes/services/classesService';

export function useClassBySlug(slug: string | undefined) {
  const [data, setData] = useState<GymClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      setError('Clase no válida');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchClassBySlug(slug);
      setData(result);
      if (!result) setError('Clase no encontrada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la clase';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
