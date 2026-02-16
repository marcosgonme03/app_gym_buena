import { supabase } from '@/lib/supabase/client';
import type { SessionWithExercises } from '@/features/member/workoutPlan/types';
import { insertWorkoutLog } from '@/services/workoutLogs';

let hasWorkoutSessionsTable: boolean | null = null;
let hasLoggedMissingTable = false;

const MISSING_TABLE_ERROR =
  'Falta la tabla workout_sessions en Supabase. Ejecuta backend/create-workout-sessions-table.sql';

function isMissingTableError(error: any) {
  const message = (error?.message || '').toLowerCase();
  const details = (error?.details || '').toLowerCase();
  const code = (error?.code || '').toString().toLowerCase();
  const status = Number(error?.status || 0);
  return (
    status === 404 ||
    message.includes('workout_sessions') && (message.includes('not found') || message.includes('does not exist'))
  ) || details.includes('workout_sessions') || code === '42p01' || code === 'pgrst205';
}

async function ensureWorkoutSessionsTableAvailable() {
  if (hasWorkoutSessionsTable !== null) return hasWorkoutSessionsTable;

  const { error } = await supabase
    .from('workout_sessions')
    .select('id', { head: true, count: 'exact' })
    .limit(1);

  if (error) {
    if (isMissingTableError(error)) {
      hasWorkoutSessionsTable = false;
      if (!hasLoggedMissingTable) {
        console.warn('[workoutSessions] Tabla faltante:', MISSING_TABLE_ERROR);
        hasLoggedMissingTable = true;
      }
      return false;
    }
    throw error;
  }

  hasWorkoutSessionsTable = true;
  return true;
}

export type WorkoutSessionStatus = 'not_started' | 'in_progress' | 'completed';

export interface WorkoutSessionRecord {
  id: string;
  user_id: string;
  workout_date: string;
  plan_session_id: string | null;
  status: WorkoutSessionStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  estimated_duration_min: number | null;
  actual_duration_min: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertWorkoutSessionPayload {
  workoutDate: string;
  planSessionId?: string | null;
  status: WorkoutSessionStatus;
  estimatedDurationMin?: number | null;
  actualDurationMin?: number | null;
  notes?: string | null;
}

export async function getWorkoutSessionByDate(workoutDate: string): Promise<WorkoutSessionRecord | null> {
  const available = await ensureWorkoutSessionsTableAvailable();
  if (!available) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('workout_date', workoutDate)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      hasWorkoutSessionsTable = false;
      if (!hasLoggedMissingTable) {
        console.warn('[workoutSessions] Tabla faltante:', MISSING_TABLE_ERROR);
        hasLoggedMissingTable = true;
      }
      return null;
    }
    console.error('[workoutSessions] Error al obtener sesión por fecha:', error);
    throw new Error('No se pudo cargar la sesión de entrenamiento');
  }

  return data;
}

export async function getWorkoutSessionById(sessionId: string): Promise<WorkoutSessionRecord | null> {
  const available = await ensureWorkoutSessionsTableAvailable();
  if (!available) {
    throw new Error(MISSING_TABLE_ERROR);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      hasWorkoutSessionsTable = false;
      throw new Error(MISSING_TABLE_ERROR);
    }
    console.error('[workoutSessions] Error al obtener sesión por id:', error);
    throw new Error('No se pudo cargar el resumen de la sesión');
  }

  return data;
}

export async function upsertWorkoutSession(payload: UpsertWorkoutSessionPayload): Promise<WorkoutSessionRecord> {
  const available = await ensureWorkoutSessionsTableAvailable();
  if (!available) {
    throw new Error(MISSING_TABLE_ERROR);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('workout_sessions')
    .upsert(
      {
        user_id: user.id,
        workout_date: payload.workoutDate,
        plan_session_id: payload.planSessionId ?? null,
        status: payload.status,
        started_at: payload.status === 'in_progress' ? new Date().toISOString() : null,
        completed_at: payload.status === 'completed' ? new Date().toISOString() : null,
        estimated_duration_min: payload.estimatedDurationMin ?? null,
        actual_duration_min: payload.actualDurationMin ?? null,
        notes: payload.notes ?? null,
      },
      { onConflict: 'user_id,workout_date' }
    )
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      hasWorkoutSessionsTable = false;
      throw new Error(MISSING_TABLE_ERROR);
    }
    console.error('[workoutSessions] Error al upsert sesión:', error);
    throw new Error('No se pudo actualizar la sesión de entrenamiento');
  }

  return data;
}

export async function completeWorkoutSession(
  sessionId: string,
  payload?: { notes?: string; actualDurationMin?: number; workoutType?: string }
): Promise<WorkoutSessionRecord> {
  const available = await ensureWorkoutSessionsTableAvailable();
  if (!available) {
    throw new Error(MISSING_TABLE_ERROR);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      status: 'completed',
      completed_at: completedAt,
      actual_duration_min: payload?.actualDurationMin ?? null,
      notes: payload?.notes ?? null,
      updated_at: completedAt,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      hasWorkoutSessionsTable = false;
      throw new Error(MISSING_TABLE_ERROR);
    }
    console.error('[workoutSessions] Error al completar sesión:', error);
    throw new Error('No se pudo completar la sesión');
  }

  await insertWorkoutLog({
    workout_type: payload?.workoutType ?? 'general',
    notes: payload?.notes ?? 'Entrenamiento completado desde sesión diaria',
    performed_at: completedAt,
  });

  return data;
}

export interface TodayWorkoutSummary {
  workoutDate: string;
  status: WorkoutSessionStatus;
  session: WorkoutSessionRecord | null;
  plannedWorkout: SessionWithExercises | null;
  estimatedDurationMin: number;
  exerciseCount: number;
  lastUpdatedAt: string | null;
}
