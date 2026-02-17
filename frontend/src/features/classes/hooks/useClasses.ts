import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchClassesCatalog } from '@/features/classes/services/classesService';
import type { GymClass } from '@/features/classes/types';

interface SessionSummary {
  id: string;
  startsAt: string;
  endsAt: string;
  remainingSpots: number;
  totalSpots: number;
  isCancelled: boolean;
}

export interface ClassListItem extends GymClass {
  trainerName: string;
  nextSessions: SessionSummary[];
  availableSpots: number;
}

interface UseClassesParams {
  search?: string;
  level?: 'all' | 'beginner' | 'intermediate' | 'advanced';
  onlyActive?: boolean;
  daysAhead?: number;
}

export function useClasses(params?: UseClassesParams) {
  const [data, setData] = useState<ClassListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const classes = await fetchClassesCatalog({
        search: params?.search || '',
        level: params?.level || 'all',
        onlyActive: params?.onlyActive ?? true,
      });

      if (classes.length === 0) {
        setData([]);
        return;
      }

      const classIds = classes.map((item) => item.id);
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + (params?.daysAhead ?? 14));

      const { data: sessionsRows, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('id,class_id,starts_at,ends_at,capacity_override,is_cancelled,classes!inner(capacity)')
        .in('class_id', classIds)
        .gte('starts_at', now.toISOString())
        .lte('starts_at', end.toISOString())
        .order('starts_at', { ascending: true });

      if (sessionsError) throw sessionsError;

      let sessions = (sessionsRows || []) as Array<{
        id: string;
        class_id: string;
        starts_at: string;
        ends_at: string;
        capacity_override: number | null;
        is_cancelled: boolean;
        classes: { capacity: number } | { capacity: number }[];
      }>;

      if (sessions.length === 0) {
        const fallback = await supabase
          .from('class_sessions')
          .select('id,class_id,starts_at,ends_at,capacity_override,is_cancelled,classes!inner(capacity)')
          .in('class_id', classIds)
          .gte('starts_at', now.toISOString())
          .order('starts_at', { ascending: true })
          .limit(300);

        if (fallback.error) throw fallback.error;
        sessions = (fallback.data || []) as Array<{
          id: string;
          class_id: string;
          starts_at: string;
          ends_at: string;
          capacity_override: number | null;
          is_cancelled: boolean;
          classes: { capacity: number } | { capacity: number }[];
        }>;
      }

      const sessionIds = sessions.map((session) => session.id);
      const bookingCounts = new Map<string, number>();

      if (sessionIds.length > 0) {
        const { data: countsRows, error: countsError } = await supabase.rpc('get_sessions_booking_counts', {
          p_session_ids: sessionIds,
        });

        if (countsError) throw countsError;

        for (const row of (countsRows || []) as Array<{ session_id: string; booked_count: number }>) {
          bookingCounts.set(row.session_id, row.booked_count || 0);
        }
      }

      const sessionsByClass = new Map<string, SessionSummary[]>();
      for (const session of sessions) {
        const classRelation = Array.isArray(session.classes) ? session.classes[0] : session.classes;
        const totalSpots = session.capacity_override ?? classRelation.capacity;
        const booked = bookingCounts.get(session.id) ?? 0;
        const remaining = Math.max(totalSpots - booked, 0);

        const mapped: SessionSummary = {
          id: session.id,
          startsAt: session.starts_at,
          endsAt: session.ends_at,
          remainingSpots: remaining,
          totalSpots,
          isCancelled: session.is_cancelled,
        };

        const list = sessionsByClass.get(session.class_id) ?? [];
        list.push(mapped);
        sessionsByClass.set(session.class_id, list);
      }

      const result: ClassListItem[] = classes.map((item) => {
        const nextSessions = (sessionsByClass.get(item.id) ?? []).slice(0, 3);
        const firstAvailable = nextSessions.find((session) => !session.isCancelled && session.remainingSpots > 0);

        return {
          ...item,
          trainerName: item.users ? `${item.users.name} ${item.users.last_name}`.trim() : 'Entrenador asignado',
          nextSessions,
          availableSpots: firstAvailable?.remainingSpots ?? 0,
        };
      });

      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las clases';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.level, params?.onlyActive, params?.daysAhead]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refresh();
    }, 20000);

    const onFocus = () => {
      refresh();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
