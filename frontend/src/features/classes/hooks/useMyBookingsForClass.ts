import { useCallback, useEffect, useState } from 'react';
import type { ClassBooking } from '@/features/classes/types';
import { BOOKING_UPDATED_EVENT, fetchMyBookingsForClass } from '@/features/classes/services/classesService';

export function useMyBookingsForClass(classId: string | undefined, limit = 5) {
  const [data, setData] = useState<ClassBooking[]>([]);
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
      const bookings = await fetchMyBookingsForClass(classId, limit);
      setData(bookings);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus reservas');
    } finally {
      setLoading(false);
    }
  }, [classId, limit]);

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
