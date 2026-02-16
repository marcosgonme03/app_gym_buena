import { useCallback, useEffect, useState } from 'react';
import type { GymClass } from '@/features/classes/types';
import { fetchClassesCatalog } from '@/features/classes/services/classesService';

export function useClassesCatalog(params: {
  search: string;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  onlyActive: boolean;
}) {
  const [data, setData] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const classes = await fetchClassesCatalog(params);
      setData(classes);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el catálogo de clases');
    } finally {
      setLoading(false);
    }
  }, [params.search, params.level, params.onlyActive]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
