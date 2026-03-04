// ============================================================================
// PROGRESS MODULE — SERVICE LAYER
// Pure Supabase view / RPC queries. Zero JS calculations.
// All aggregations live in progress-module-migration.sql.
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type {
  ProgressStats,
  PersonalRecord,
  MostFrequentExercise,
  EvolutionPoint,
  RecentSession,
  ProgressData,
} from '../types';

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuario no autenticado');
  return user.id;
}


// ─────────────────────────────────────────────────────────────────────────────
// STATS — RPC get_workout_stats (includes months_active)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProgressStats(): Promise<ProgressStats> {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc('get_workout_stats', { p_user_id: userId });

  if (error || !data?.[0]) throw new Error('No se pudieron cargar las estadísticas');

  const r = data[0] as any;
  return {
    total_sessions:      Number(r.total_sessions)      || 0,
    total_weight_kg:     Math.round(Number(r.total_weight_kg) || 0),
    this_month_sessions: Number(r.this_month_sessions) || 0,
    this_week_sessions:  Number(r.this_week_sessions)  || 0,
    avg_duration_min:    r.avg_duration_min != null ? Number(r.avg_duration_min) : null,
    months_active:       Number(r.months_active)       || 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAL RECIENTE — vista v_workout_history
// ─────────────────────────────────────────────────────────────────────────────

export async function getRecentSessions(limit = 5): Promise<RecentSession[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('v_workout_history')
    .select('id, workout_date, session_name, category, status, actual_duration_min, total_weight_kg, exercise_count')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error('No se pudieron cargar las sesiones recientes');
  return (data || []) as RecentSession[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RÉCORDS PERSONALES — vista v_personal_records
// ─────────────────────────────────────────────────────────────────────────────

export async function getPersonalRecords(limit = 4): Promise<PersonalRecord[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('v_personal_records')
    .select('exercise_name, max_weight_kg, total_exercises, last_date, session_id')
    .eq('user_id', userId)
    .order('max_weight_kg', { ascending: false })
    .limit(limit);

  if (error) throw new Error('No se pudieron cargar los récords personales');
  return (data || []).map((r: any) => ({
    exercise_name:   r.exercise_name,
    max_weight_kg:   Number(r.max_weight_kg),
    total_exercises: Number(r.total_exercises),
    date:            r.last_date ?? '',
    session_id:      r.session_id ?? '',
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// EJERCICIO MÁS FRECUENTE — vista v_most_frequent_exercise
// ─────────────────────────────────────────────────────────────────────────────

export async function getMostFrequentExercise(): Promise<MostFrequentExercise | null> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('v_most_frequent_exercise')
    .select('exercise_name, total_times')
    .eq('user_id', userId)
    .order('total_times', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error('No se pudo cargar el ejercicio más frecuente');
  if (!data) return null;
  return { exercise_name: data.exercise_name, total_times: Number(data.total_times) };
}

// ─────────────────────────────────────────────────────────────────────────────
// EVOLUCIÓN SEMANAL — RPC get_workout_evolution
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorkoutEvolution(weeksBack = 12): Promise<EvolutionPoint[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc('get_workout_evolution', {
    p_user_id: userId,
    p_weeks:   weeksBack,
  });

  if (error) throw new Error('No se pudo cargar la evolución semanal');
  return (data || []).map((row: any, i: number) => ({
    week_label:      `S${i + 1}`,
    week_start:      row.week_start,
    total_weight_kg: Number(row.total_weight_kg) || 0,
    session_count:   Number(row.session_count)   || 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD ALL — Promise.all para la página
// ─────────────────────────────────────────────────────────────────────────────

export async function loadAllProgressData(): Promise<ProgressData> {
  const [stats, recentSessions, records, mostFrequent, evolution] = await Promise.all([
    getProgressStats(),
    getRecentSessions(5),
    getPersonalRecords(4),
    getMostFrequentExercise(),
    getWorkoutEvolution(12),
  ]);
  return { stats, recentSessions, records, mostFrequent, evolution };
}
