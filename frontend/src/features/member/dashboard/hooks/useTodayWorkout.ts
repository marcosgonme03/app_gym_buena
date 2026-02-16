import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WeeklyPlanFullDTO } from '@/features/member/workoutPlan/types';
import {
  getWorkoutSessionByDate,
  upsertWorkoutSession,
  type TodayWorkoutSummary,
  type WorkoutSessionStatus,
} from '@/services/supabase/workoutSessions';

interface TodayWorkoutState {
  loading: boolean;
  error: string | null;
  data: TodayWorkoutSummary | null;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export function useTodayWorkout(planData: WeeklyPlanFullDTO | null) {
  const [state, setState] = useState<TodayWorkoutState>({
    loading: true,
    error: null,
    data: null,
  });

  const refresh = useCallback(async () => {
    const today = getTodayDate();
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const plannedWorkout = planData?.sessions.find(session => session.session_date === today) || null;
      const existingSession = await getWorkoutSessionByDate(today);

      let status: WorkoutSessionStatus = 'not_started';
      if (existingSession?.status) {
        status = existingSession.status;
      } else if (plannedWorkout) {
        status = 'not_started';
      }

      const exerciseCount = plannedWorkout?.exercises.length ?? 0;
      const estimatedDurationMin = existingSession?.estimated_duration_min ?? Math.max(20, exerciseCount * 8);

      setState({
        loading: false,
        error: null,
        data: {
          workoutDate: today,
          status,
          session: existingSession,
          plannedWorkout,
          estimatedDurationMin,
          exerciseCount,
          lastUpdatedAt: existingSession?.updated_at || plannedWorkout?.updated_at || null,
        },
      });
    } catch (error: any) {
      setState({
        loading: false,
        error: error.message || 'No se pudo cargar el entrenamiento de hoy',
        data: null,
      });
    }
  }, [planData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startWorkout = useCallback(async () => {
    if (!state.data) return null;

    const updated = await upsertWorkoutSession({
      workoutDate: state.data.workoutDate,
      planSessionId: state.data.plannedWorkout?.id ?? null,
      status: 'in_progress',
      estimatedDurationMin: state.data.estimatedDurationMin,
    });

    await refresh();
    return updated;
  }, [state.data, refresh]);

  const humanLastUpdated = useMemo(() => {
    if (!state.data?.lastUpdatedAt) return 'Sin actualizaciones recientes';

    const updated = new Date(state.data.lastUpdatedAt).getTime();
    const now = Date.now();
    const diffMs = updated - now;

    const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
    const minutes = Math.round(diffMs / (1000 * 60));

    if (Math.abs(minutes) < 60) {
      return formatter.format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return formatter.format(hours, 'hour');
    }

    const days = Math.round(hours / 24);
    return formatter.format(days, 'day');
  }, [state.data?.lastUpdatedAt]);

  return {
    ...state,
    startWorkout,
    refresh,
    humanLastUpdated,
  };
}
