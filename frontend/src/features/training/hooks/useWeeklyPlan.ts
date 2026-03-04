// ============================================================================
// useWeeklyPlan — Plan semanal: carga, guarda y elimina días
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  getWeeklyPlan,
  upsertWeeklyPlanDay,
  removeWeeklyPlanDay,
} from '../services/trainingService';
import type { WeeklyPlanDay } from '../types';

// 7 días: índice 0=Lunes … 6=Domingo
export const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DAY_SHORT  = ['Lun',   'Mar',    'Mié',       'Jue',    'Vie',     'Sáb',    'Dom'  ];

/** Calcula el día de semana LOCAL del día actual (0=Lun … 6=Dom) */
export function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay(); // 0=Sun … 6=Sat
  return (jsDay + 6) % 7;           // → 0=Mon … 6=Sun
}

interface UseWeeklyPlanResult {
  plan: WeeklyPlanDay[];       // Array sparse (solo los días configurados)
  planMap: Record<number, WeeklyPlanDay>; // key = day_of_week
  loading: boolean;
  saving: boolean;
  error: string | null;
  setDay:    (dayOfWeek: number, routineId: string)  => Promise<void>;
  removeDay: (dayOfWeek: number)                      => Promise<void>;
  refresh:   ()                                       => Promise<void>;
}

export function useWeeklyPlan(): UseWeeklyPlanResult {
  const [plan,    setPlan]    = useState<WeeklyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const planMap: Record<number, WeeklyPlanDay> = {};
  plan.forEach(day => { planMap[day.day_of_week] = day; });

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyPlan();
      setPlan(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el plan semanal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const setDay = useCallback(async (dayOfWeek: number, routineId: string) => {
    try {
      setSaving(true);
      setError(null);
      const updated = await upsertWeeklyPlanDay(dayOfWeek, routineId);
      setPlan(prev => {
        const next = prev.filter(d => d.day_of_week !== dayOfWeek);
        return [...next, updated].sort((a, b) => a.day_of_week - b.day_of_week);
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar el día');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeDay = useCallback(async (dayOfWeek: number) => {
    try {
      setSaving(true);
      setError(null);
      await removeWeeklyPlanDay(dayOfWeek);
      setPlan(prev => prev.filter(d => d.day_of_week !== dayOfWeek));
    } catch (err: any) {
      setError(err.message || 'Error al quitar el día');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { plan, planMap, loading, saving, error, setDay, removeDay, refresh };
}
