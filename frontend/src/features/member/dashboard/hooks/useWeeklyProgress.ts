import { useCallback, useEffect, useState } from 'react';
import { getWeeklyWorkoutDistribution } from '@/services/workoutLogs';
import type { WeeklyStats } from '@/lib/supabase/types';
import type { WeeklyProgressData } from '@/components/member/WeeklyProgressCard';

interface WeeklyProgressState {
  loading: boolean;
  error: string | null;
  data: WeeklyProgressData;
}

const emptyProgress: WeeklyProgressData = {
  weeklyGoal: 3,
  completedTotal: 0,
  points: [
    { label: 'L', completed: 0 },
    { label: 'M', completed: 0 },
    { label: 'X', completed: 0 },
    { label: 'J', completed: 0 },
    { label: 'V', completed: 0 },
    { label: 'S', completed: 0 },
    { label: 'D', completed: 0 },
  ],
};

export function useWeeklyProgress(weekStart: string, weeklyStats: WeeklyStats | null) {
  const [state, setState] = useState<WeeklyProgressState>({
    loading: true,
    error: null,
    data: emptyProgress,
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const distribution = await getWeeklyWorkoutDistribution(weekStart);
      const points = distribution.map((point) => ({
        label: point.label,
        completed: point.completed,
      }));

      const completedTotal = weeklyStats?.weeklyCount ?? points.reduce((acc, point) => acc + point.completed, 0);
      const weeklyGoal = weeklyStats?.weeklyGoal ?? 3;

      setState({
        loading: false,
        error: null,
        data: {
          weeklyGoal,
          completedTotal,
          points: points.length > 0 ? points : emptyProgress.points,
        },
      });
    } catch (error: any) {
      setState({
        loading: false,
        error: error.message || 'No se pudo cargar el progreso semanal',
        data: {
          ...emptyProgress,
          weeklyGoal: weeklyStats?.weeklyGoal ?? emptyProgress.weeklyGoal,
          completedTotal: weeklyStats?.weeklyCount ?? emptyProgress.completedTotal,
        },
      });
    }
  }, [weekStart, weeklyStats?.weeklyCount, weeklyStats?.weeklyGoal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
