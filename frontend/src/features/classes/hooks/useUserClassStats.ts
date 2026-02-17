import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UserClassStats {
  attendedCount: number;
  lastAttendedAt: string | null;
}

export function useUserClassStats(classId: string | undefined) {
  const [data, setData] = useState<UserClassStats>({ attendedCount: 0, lastAttendedAt: null });
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

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user?.id) {
        setData({ attendedCount: 0, lastAttendedAt: null });
        return;
      }

      const { data: rows, error: rowsError } = await supabase
        .from('class_bookings')
        .select('booked_at,class_sessions!inner(class_id,starts_at)')
        .eq('user_id', userData.user.id)
        .eq('status', 'attended')
        .eq('class_sessions.class_id', classId)
        .order('booked_at', { ascending: false });

      if (rowsError) throw rowsError;

      const list = (rows || []) as Array<{ booked_at: string; class_sessions?: { starts_at?: string } }>;
      setData({
        attendedCount: list.length,
        lastAttendedAt: list[0]?.class_sessions?.starts_at || list[0]?.booked_at || null,
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar tu historial en esta clase');
      setData({ attendedCount: 0, lastAttendedAt: null });
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
