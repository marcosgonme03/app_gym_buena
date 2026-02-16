import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyStats } from '@/services/workoutLogs';
import { getWeeklyPlanFull } from '../workoutPlan/api';
import type { WeeklyStats } from '@/lib/supabase/types';
import type { WeeklyPlanFullDTO } from '../workoutPlan/types';

interface DashboardData {
  weeklyStats: WeeklyStats | null;
  planData: WeeklyPlanFullDTO | null;
  loading: boolean;
}

/**
 * Hook centralizado para cargar datos del dashboard
 * Evita múltiples llamadas cuando hay componentes duplicados (mobile + desktop)
 */
export function useDashboardData(weekStart: string, weekEnd: string) {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData>({
    weeklyStats: null,
    planData: null,
    loading: true,
  });

  const loadData = useCallback(async () => {
    if (!profile || profile.role !== 'member') {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true }));

      // Cargar ambos en paralelo (solo 2 llamadas totales en vez de 4)
      const [weeklyStats, planData] = await Promise.all([
        getWeeklyStats(undefined, weekStart, weekEnd),
        getWeeklyPlanFull(weekStart),
      ]);

      setData({
        weeklyStats,
        planData,
        loading: false,
      });
    } catch (error) {
      console.error('[useDashboardData] Error:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [profile, weekStart, weekEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { ...data, reload: loadData };
}
