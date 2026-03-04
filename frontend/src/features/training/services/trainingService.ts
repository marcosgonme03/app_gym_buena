// ============================================================================
// TRAINING MODULE — SERVICE LAYER
// Todas las queries a Supabase están centralizadas aquí.
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type {
  Routine,
  RoutineExercise,
  RoutineWithExercises,
  WeeklyPlanDay,
  WorkoutSession,
  SessionExercise,
  SessionWithExercises,
  WorkoutStats,
  HistoryItem,
  CalendarDayData,
  CreateRoutinePayload,
  CreateFreeSessionPayload,
  CompleteSessionPayload,
  UpdateExerciseSetPayload,
} from '../types';

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuario no autenticado');
  return user.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTINES
// ─────────────────────────────────────────────────────────────────────────────

/** Lista todas las rutinas del usuario con conteo de ejercicios */
export async function getRoutines(): Promise<Routine[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_exercises(id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('No se pudieron cargar las rutinas');

  return (data || []).map((r: any) => ({
    ...r,
    exercise_count: r.routine_exercises?.length ?? 0,
    routine_exercises: undefined,
  }));
}

/** Obtiene una rutina con todos sus ejercicios */
export async function getRoutineWithExercises(routineId: string): Promise<RoutineWithExercises> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('routines')
    .select(`*, routine_exercises(*)`)
    .eq('id', routineId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Rutina no encontrada');

  return {
    ...data,
    exercises: (data.routine_exercises || []).sort(
      (a: RoutineExercise, b: RoutineExercise) => a.order_index - b.order_index,
    ),
  };
}

/** Crea una rutina con sus ejercicios en una sola operación */
export async function createRoutine(payload: CreateRoutinePayload): Promise<RoutineWithExercises> {
  const userId = await getUserId();

  const { data: routine, error: rErr } = await supabase
    .from('routines')
    .insert({
      user_id:                userId,
      name:                   payload.name.trim(),
      category:               payload.category,
      description:            payload.description ?? null,
      estimated_duration_min: payload.estimated_duration_min ?? null,
    })
    .select()
    .single();

  if (rErr || !routine) throw new Error('No se pudo crear la rutina');

  if (payload.exercises && payload.exercises.length > 0) {
    const { error: eErr } = await supabase.from('routine_exercises').insert(
      payload.exercises.map((ex, idx) => ({
        routine_id:    routine.id,
        user_id:       userId,
        exercise_name: ex.exercise_name.trim(),
        sets:          ex.sets,
        reps:          ex.reps,
        weight_kg:     ex.weight_kg ?? null,
        rest_seconds:  ex.rest_seconds ?? null,
        notes:         ex.notes ?? null,
        order_index:   ex.order_index ?? idx,
      })),
    );
    if (eErr) console.warn('[trainingService] Error al insertar ejercicios:', eErr);
  }

  return getRoutineWithExercises(routine.id);
}

/** Elimina una rutina */
export async function deleteRoutine(routineId: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)
    .eq('user_id', userId);
  if (error) throw new Error('No se pudo eliminar la rutina');
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY PLAN
// ─────────────────────────────────────────────────────────────────────────────

/** Devuelve los 7 días del plan semanal (con la rutina poblada si existe) */
export async function getWeeklyPlan(): Promise<WeeklyPlanDay[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('weekly_plans')
    .select(`*, routines(*)`)
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true });

  if (error) throw new Error('No se pudo cargar el plan semanal');

  return (data || []).map((row: any) => ({
    id:          row.id,
    user_id:     row.user_id,
    day_of_week: row.day_of_week,
    routine_id:  row.routine_id,
    routine:     row.routines ?? null,
    created_at:  row.created_at,
    updated_at:  row.updated_at,
  }));
}

/** 
 * Asigna o cambia la rutina de un día.
 * Usa upsert por (user_id, day_of_week). 
 */
export async function upsertWeeklyPlanDay(
  dayOfWeek: number,
  routineId: string,
): Promise<WeeklyPlanDay> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('weekly_plans')
    .upsert(
      { user_id: userId, day_of_week: dayOfWeek, routine_id: routineId },
      { onConflict: 'user_id,day_of_week' },
    )
    .select(`*, routines(*)`)
    .single();

  if (error || !data) throw new Error('No se pudo guardar el plan');
  return { ...data, routine: (data as any).routines ?? null };
}

/** Elimina la rutina asignada a un día (no borra sesiones pasadas) */
export async function removeWeeklyPlanDay(dayOfWeek: number): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('weekly_plans')
    .delete()
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek);
  if (error) throw new Error('No se pudo quitar el día del plan');
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — CREATION
// ─────────────────────────────────────────────────────────────────────────────

/** 
 * Flujo principal "Crear plan para hoy":
 * 1. Verifica si hoy tiene rutina en weekly_plans
 * 2. Si sí → crea sesión con esa rutina via RPC
 * 3. Retorna null si no hay rutina asignada hoy (trigger modal de selección)
 */
export async function createSessionFromTodayPlan(): Promise<WorkoutSession | null> {
  const userId = await getUserId();
  // .maybeSingle() is needed: Supabase wraps composite-type RPCs in an array by default.
  // Without it, data = [{id:..., ...}] → session.id === undefined → navigates to /sesion/undefined
  const { data, error } = await supabase
    .rpc('create_session_from_today_plan', { p_user_id: userId })
    .maybeSingle();

  // RPC not found (migration pending) or no plan for today → return null to trigger modal
  if (error) return null;
  return (data as WorkoutSession) ?? null;
}

/**
 * Crea una sesión usando una rutina específica para una fecha concreta.
 * Evita duplicados automáticamente (via RPC).
 */
export async function createSessionWithRoutine(
  routineId: string,
  date?: string,
): Promise<WorkoutSession> {
  const userId  = await getUserId();
  const params: Record<string, unknown> = { p_user_id: userId, p_routine_id: routineId };
  if (date) params.p_date = date;

  const { data: rpcData, error: rpcErr } = await supabase.rpc('create_session_with_routine', params);
  if (!rpcErr && rpcData) return rpcData as WorkoutSession;

  // ── Fallback: RPC doesn't exist yet (migration pending) ──────────────────
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  // Avoid duplicate: return existing active session for same routine+date
  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_date', targetDate)
    .in('status', ['planned', 'not_started', 'in_progress'])
    .maybeSingle();
  if (existing) return existing as WorkoutSession;

  // Try insert with new columns (migration run)
  const { data: full, error: fullErr } = await supabase
    .from('workout_sessions')
    .insert({ user_id: userId, workout_date: targetDate, routine_id: routineId, status: 'planned' })
    .select().single();
  if (!fullErr && full) return full as WorkoutSession;

  // Pre-migration fallback: insert with old schema only — use 'not_started' (old allowed value)
  const { data: minimal, error: minErr } = await supabase
    .from('workout_sessions')
    .insert({ user_id: userId, workout_date: targetDate, status: 'not_started' })
    .select().single();
  if (minErr || !minimal) throw new Error('No se pudo crear la sesión con rutina');
  return minimal as WorkoutSession;
}

/** Crea una sesión libre (sin rutina) */
export async function createFreeSession(payload: CreateFreeSessionPayload): Promise<WorkoutSession> {
  const userId = await getUserId();

  // Try full insert with all migration columns
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id:                userId,
      workout_date:           payload.workout_date,
      session_name:           payload.session_name.trim(),
      category:               payload.category,
      muscle_group:           payload.muscle_group ?? null,
      estimated_duration_min: payload.estimated_duration_min ?? null,
      notes:                  payload.notes ?? null,
      status:                 'planned',
    })
    .select()
    .single();

  if (!error && data) return data as WorkoutSession;

  // Pre-migration fallback: old schema (no new columns, old status values)
  const { data: minimal, error: minErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id:      userId,
      workout_date: payload.workout_date,
      notes:        payload.notes ?? null,
      status:       'not_started',
    })
    .select()
    .single();

  if (minErr || !minimal) throw new Error('No se pudo crear el entrenamiento');
  // Augment with local fields so the rest of the app works
  return {
    ...minimal,
    session_name: payload.session_name,
    category:     payload.category,
  } as WorkoutSession;
}

/** 
 * Repite una sesión del historial creando una nueva para hoy.
 * Si ya existe una sesión planned/in_progress hoy con la misma rutina, la devuelve.
 */
export async function repeatSession(sourceSessionId: string): Promise<WorkoutSession> {
  const userId = await getUserId();

  // Obtener sesión original
  const { data: source, error: srcErr } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', sourceSessionId)
    .eq('user_id', userId)
    .single();

  if (srcErr || !source) throw new Error('Sesión original no encontrada');

  const today = new Date().toISOString().split('T')[0];

  if (source.routine_id) {
    return createSessionWithRoutine(source.routine_id, today);
  }

  // Verificar si ya existe sesión libre hoy con mismo nombre
  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_date', today)
    .eq('session_name', source.session_name)
    .in('status', ['planned', 'not_started', 'in_progress'])
    .maybeSingle();

  if (existing) return existing as WorkoutSession;

  return createFreeSession({
    workout_date:           today,
    session_name:           source.session_name || 'Entrenamiento libre',
    category:               source.category || 'general',
    estimated_duration_min: source.estimated_duration_min ?? undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve la sesión activa del usuario para HOY (planned / not_started / in_progress).
 * Retorna null si no existe ninguna. Sin throw.
 */
export async function getActiveSession(): Promise<WorkoutSession | null> {
  const userId = await getUserId();
  const today  = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_date', today)
    .in('status', ['planned', 'not_started', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
}

/** Obtiene una sesión con sus ejercicios y rutina relacionada */
export async function getSessionWithExercises(sessionId: string): Promise<SessionWithExercises> {
  if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
    throw new Error('Sesión no encontrada');
  }
  const userId = await getUserId();

  // Try to join routines (only works after migration)
  const { data: sessionFull, error: sErrFull } = await supabase
    .from('workout_sessions')
    .select('*, routines(*)')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  // Fallback: plain select without join (pre-migration, routines table doesn't exist yet)
  let session: any = sessionFull;
  if (sErrFull || !sessionFull) {
    const { data: plain, error: sErrPlain } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (sErrPlain) throw new Error(`Error al cargar la sesión: ${sErrPlain.message}`);
    if (!plain) throw new Error('Sesión no encontrada');
    session = plain;
  }

  // Try to fetch session_exercises (only works after migration)
  const { data: exercises } = await supabase
    .from('session_exercises')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('order_index', { ascending: true });

  return {
    ...session,
    routine:   session.routines ?? null,
    exercises: (exercises || []) as SessionExercise[],
  };
}

/** Obtiene las sesiones del mes para el calendario */
export async function getMonthSessions(year: number, month: number): Promise<CalendarDayData[]> {
  const userId = await getUserId();
  const mm       = String(month + 1).padStart(2, '0');
  const lastDay  = new Date(year, month + 1, 0).getDate();
  const start    = `${year}-${mm}-01`;
  const end      = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, workout_date, session_name, status, category')
    .eq('user_id', userId)
    .gte('workout_date', start)
    .lte('workout_date', end)
    .order('workout_date', { ascending: true });

  if (error) throw new Error('No se pudo cargar el calendario');

  // Group by date
  const map = new Map<string, CalendarDayData>();
  for (const row of (data || []) as any[]) {
    if (!map.has(row.workout_date)) {
      map.set(row.workout_date, { date: row.workout_date, sessions: [] });
    }
    map.get(row.workout_date)!.sessions.push({
      id:           row.id,
      session_name: row.session_name,
      status:       row.status,
      category:     row.category,
    });
  }

  return Array.from(map.values());
}

/** Obtiene sesiones de un día específico */
export async function getDaySessions(date: string): Promise<WorkoutSession[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_date', date)
    .order('created_at', { ascending: false });

  if (error) throw new Error('No se pudieron cargar las sesiones del día');
  return (data || []) as WorkoutSession[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS — UPDATES
// ─────────────────────────────────────────────────────────────────────────────

/** Inicia una sesión: cambia status a in_progress y guarda started_at */
export async function startSession(sessionId: string): Promise<WorkoutSession> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo iniciar la sesión');
  return data as WorkoutSession;
}

/** Completa una sesión: el backend recalcula total_weight_kg/exercise_count via trigger */
export async function completeSession(
  sessionId: string,
  payload: CompleteSessionPayload,
): Promise<WorkoutSession> {
  const userId = await getUserId();
  const now    = new Date().toISOString();

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      status:              'completed',
      completed_at:        now,
      actual_duration_min: payload.actual_duration_min,
      notes:               payload.notes ?? null,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo completar la sesión');
  return data as WorkoutSession;
}

/** Actualiza el progreso de un ejercicio dentro de la sesión */
export async function updateSessionExercise(
  exerciseId: string,
  payload: UpdateExerciseSetPayload,
): Promise<SessionExercise> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('session_exercises')
    .update({
      sets_completed: payload.sets_completed,
      weight_kg:      payload.weight_kg ?? undefined,
      completed_at:   payload.sets_completed > 0 ? (payload.completed_at || new Date().toISOString()) : null,
    })
    .eq('id', exerciseId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo actualizar el ejercicio');
  return data as SessionExercise;
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────────────────────────────────────────

/** Historial paginado desde la vista v_workout_history */
export async function getWorkoutHistory(limit = 20, offset = 0): Promise<HistoryItem[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('v_workout_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Vista podría no existir aún; fallback a tabla directa
    const { data: fallback, error: fbErr } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('workout_date', { ascending: false })
      .range(offset, offset + limit - 1);
    if (fbErr) throw new Error('No se pudo cargar el historial');
    return (fallback || []).map((r: any) => ({
      id:                  r.id,
      user_id:             r.user_id,
      workout_date:        r.workout_date,
      session_name:        r.session_name || 'Entrenamiento libre',
      category:            r.category || 'general',
      status:              r.status,
      actual_duration_min: r.actual_duration_min ?? null,
      total_weight_kg:     r.total_weight_kg ?? null,
      exercise_count:      r.exercise_count ?? 0,
      routine_id:          r.routine_id ?? null,
      completed_at:        r.completed_at ?? null,
    }));
  }

  return (data || []) as HistoryItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

/** Estadísticas vía RPC get_workout_stats */
export async function getWorkoutStats(): Promise<WorkoutStats> {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc('get_workout_stats', { p_user_id: userId });

  if (error || !data?.[0]) {
    // Fallback manual si RPC no existe aún
    const { count } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');
    return {
      total_sessions:      count ?? 0,
      total_weight_kg:     0,
      this_month_sessions: 0,
      this_week_sessions:  0,
      avg_duration_min:    null,
    };
  }

  const row = data[0];
  return {
    total_sessions:      Number(row.total_sessions)       || 0,
    total_weight_kg:     Math.round(Number(row.total_weight_kg) || 0),
    this_month_sessions: Number(row.this_month_sessions)  || 0,
    this_week_sessions:  Number(row.this_week_sessions)   || 0,
    avg_duration_min:    row.avg_duration_min ? Number(row.avg_duration_min) : null,
  };
}
