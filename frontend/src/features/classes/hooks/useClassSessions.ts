import { useCallback, useEffect, useState } from 'react';
import type { SessionWithAvailability } from '@/features/classes/types';
import { fetchClassSessionsByClass, BOOKING_UPDATED_EVENT } from '@/features/classes/services/classesService';

export function useClassSessions(classId: string | undefined, weekRange?: { start: string; end: string }) {
  const [data, setData] = useState<SessionWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sessions = await fetchClassSessionsByClass(
        classId,
        weekRange?.start,
        weekRange?.end
      );
      setData(sessions);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  }, [classId, weekRange?.start, weekRange?.end]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(BOOKING_UPDATED_EVENT, handler);
    return () => window.removeEventListener(BOOKING_UPDATED_EVENT, handler);
  }, [refresh]);

  return { data, loading, error, refresh };
}
