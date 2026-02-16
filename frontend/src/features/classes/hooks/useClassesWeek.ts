import { useCallback, useEffect, useState } from 'react';
import type { ClassesFilters, SessionWithAvailability } from '@/features/classes/types';
import { BOOKING_UPDATED_EVENT, fetchClassesWeek, fetchTrainersList } from '@/features/classes/services/classesService';

export function useClassesWeek(weekStart: string, weekEnd: string, filters: ClassesFilters) {
  const [data, setData] = useState<SessionWithAvailability[]>([]);
  const [trainers, setTrainers] = useState<Array<{ user_id: string; name: string; last_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessions, trainersData] = await Promise.all([
        fetchClassesWeek(weekStart, weekEnd, filters),
        fetchTrainersList(),
      ]);

      setData(sessions);
      setTrainers(trainersData);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las clases');
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => {
      refresh();
    };

    window.addEventListener(BOOKING_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(BOOKING_UPDATED_EVENT, handler);
    };
  }, [refresh]);

  return { data, trainers, loading, error, refresh };
}
