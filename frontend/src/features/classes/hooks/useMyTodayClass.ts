import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ClassBooking } from '@/features/classes/types';

interface TodayClassData {
  todayClass: ClassBooking | null;
  upcoming: ClassBooking[];
}

export function useMyTodayClass() {
  const [data, setData] = useState<TodayClassData>({ todayClass: null, upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: bookingsRows, error: bookingsError } = await supabase
        .from('class_bookings')
        .select(`
          *,
          class_sessions!inner (
            *,
            classes!inner (
              id,
              title,
              slug,
              description,
              trainer_user_id,
              level,
              duration_min,
              capacity,
              cover_image_url,
              is_active,
              created_at,
              updated_at
            )
          )
        `)
        .in('status', ['confirmed', 'booked'])
        .gte('class_sessions.starts_at', startOfDay.toISOString())
        .order('class_sessions(starts_at)', { ascending: true })
        .limit(4);

      if (bookingsError) throw bookingsError;

      const list = (bookingsRows || []) as ClassBooking[];
      const todayClass = list.find((booking) => {
        const startsAt = booking.class_sessions?.starts_at;
        if (!startsAt) return false;
        const startDate = new Date(startsAt);
        return startDate >= startOfDay && startDate <= endOfDay;
      }) || null;

      setData({ todayClass, upcoming: list.slice(0, 3) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar tus clases de hoy';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
