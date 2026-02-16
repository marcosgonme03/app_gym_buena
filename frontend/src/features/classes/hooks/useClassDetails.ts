import { useCallback, useEffect, useState } from 'react';
import type { GymClass } from '@/features/classes/types';
import { fetchClassBySlug } from '@/features/classes/services/classesService';

export function useClassDetails(slug: string | undefined) {
  const [data, setData] = useState<GymClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!slug) {
      setError('Clase no válida');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const item = await fetchClassBySlug(slug);
      setData(item);
      if (!item) setError('Clase no encontrada');
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el detalle de la clase');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
