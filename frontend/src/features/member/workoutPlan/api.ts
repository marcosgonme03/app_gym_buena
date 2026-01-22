// ============================================================================
// API QUERIES PARA SISTEMA DE PLANIFICACIÓN SEMANAL
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type {
  WeeklyWorkoutPlan,
  WeeklyWorkoutSession,
  WeeklyWorkoutExercise,
  WeeklyPlanFullDTO,
  SessionWithExercises,
  UpsertPlanMetaPayload,
  CreateSessionPayload,
  UpdateSessionPayload,
  CreateExercisePayload,
  UpdateExercisePayload,
  ReorderItem
} from './types';

// ============================================================================
// GESTIÓN DE PLANES
// ============================================================================

/**
 * Obtiene o crea un plan semanal para el usuario autenticado
 * Si no existe, lo crea automáticamente
 */
export async function getOrCreateWeeklyPlan(weekStart: string): Promise<WeeklyWorkoutPlan> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Intentar obtener el plan existente
  const { data: existing, error: fetchError } = await supabase
    .from('weekly_workout_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single();

  if (existing && !fetchError) {
    return existing;
  }

  // Si no existe, crear uno nuevo
  const { data: newPlan, error: createError } = await supabase
    .from('weekly_workout_plans')
    .insert({
      user_id: user.id,
      week_start: weekStart,
      title: null,
      notes: null
    })
    .select()
    .single();

  if (createError) {
    console.error('[getOrCreateWeeklyPlan] Error al crear plan:', createError);
    throw new Error('No se pudo crear el plan semanal');
  }

  return newPlan;
}

/**
 * Obtiene el plan completo con sesiones y ejercicios
 */
export async function getWeeklyPlanFull(weekStart: string): Promise<WeeklyPlanFullDTO> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Obtener o crear el plan
  const plan = await getOrCreateWeeklyPlan(weekStart);

  // 2. Obtener todas las sesiones del plan
  const { data: sessions, error: sessionsError } = await supabase
    .from('weekly_workout_sessions')
    .select('*')
    .eq('plan_id', plan.id)
    .order('order_index', { ascending: true });

  if (sessionsError) {
    console.error('[getWeeklyPlanFull] Error al obtener sesiones:', sessionsError);
    throw new Error('No se pudieron cargar las sesiones');
  }

  // 3. Si no hay sesiones, retornar plan vacío
  if (!sessions || sessions.length === 0) {
    return {
      plan,
      sessions: []
    };
  }

  // 4. Obtener todos los ejercicios de todas las sesiones
  const sessionIds = sessions.map(s => s.id);
  const { data: exercises, error: exercisesError } = await supabase
    .from('weekly_workout_exercises')
    .select('*')
    .in('session_id', sessionIds)
    .order('order_index', { ascending: true });

  if (exercisesError) {
    console.error('[getWeeklyPlanFull] Error al obtener ejercicios:', exercisesError);
    throw new Error('No se pudieron cargar los ejercicios');
  }

  // 5. Agrupar ejercicios por sesión
  const sessionsWithExercises: SessionWithExercises[] = sessions.map(session => ({
    ...session,
    exercises: (exercises || []).filter(ex => ex.session_id === session.id)
  }));

  return {
    plan,
    sessions: sessionsWithExercises
  };
}

/**
 * Actualiza los metadatos del plan (título y notas)
 */
export async function upsertPlanMeta(
  planId: string,
  payload: UpsertPlanMetaPayload
): Promise<WeeklyWorkoutPlan> {
  const { data, error } = await supabase
    .from('weekly_workout_plans')
    .update(payload)
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    console.error('[upsertPlanMeta] Error:', error);
    throw new Error('No se pudo actualizar el plan');
  }

  return data;
}

// ============================================================================
// GESTIÓN DE SESIONES
// ============================================================================

/**
 * Crea una nueva sesión de entrenamiento
 */
export async function createSession(payload: CreateSessionPayload): Promise<WeeklyWorkoutSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('weekly_workout_sessions')
    .insert({
      ...payload,
      user_id: user.id,
      order_index: payload.order_index ?? 0
    })
    .select()
    .single();

  if (error) {
    console.error('[createSession] Error:', error);
    throw new Error('No se pudo crear la sesión');
  }

  return data;
}

/**
 * Actualiza una sesión existente
 */
export async function updateSession(
  sessionId: string,
  payload: UpdateSessionPayload
): Promise<WeeklyWorkoutSession> {
  const { data, error } = await supabase
    .from('weekly_workout_sessions')
    .update(payload)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('[updateSession] Error:', error);
    throw new Error('No se pudo actualizar la sesión');
  }

  return data;
}

/**
 * Elimina una sesión (cascade elimina ejercicios automáticamente)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_workout_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('[deleteSession] Error:', error);
    throw new Error('No se pudo eliminar la sesión');
  }
}

/**
 * Reordena las sesiones de un plan
 */
export async function reorderSessions(planId: string, items: ReorderItem[]): Promise<void> {
  // Actualizar cada sesión con su nuevo order_index
  const updates = items.map(item =>
    supabase
      .from('weekly_workout_sessions')
      .update({ order_index: item.order_index })
      .eq('id', item.id)
      .eq('plan_id', planId)
  );

  const results = await Promise.all(updates);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error('[reorderSessions] Errors:', errors);
    throw new Error('No se pudo reordenar las sesiones');
  }
}

// ============================================================================
// GESTIÓN DE EJERCICIOS
// ============================================================================

/**
 * Crea un nuevo ejercicio en una sesión
 */
export async function createExercise(payload: CreateExercisePayload): Promise<WeeklyWorkoutExercise> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Validaciones
  if (payload.sets < 1 || payload.sets > 20) {
    throw new Error('Las series deben estar entre 1 y 20');
  }
  if (payload.reps < 1 || payload.reps > 50) {
    throw new Error('Las repeticiones deben estar entre 1 y 50');
  }
  if (payload.rest_seconds !== undefined && payload.rest_seconds !== null) {
    if (payload.rest_seconds < 0 || payload.rest_seconds > 600) {
      throw new Error('El descanso debe estar entre 0 y 600 segundos');
    }
  }

  const { data, error } = await supabase
    .from('weekly_workout_exercises')
    .insert({
      ...payload,
      user_id: user.id,
      order_index: payload.order_index ?? 0
    })
    .select()
    .single();

  if (error) {
    console.error('[createExercise] Error:', error);
    throw new Error('No se pudo crear el ejercicio');
  }

  return data;
}

/**
 * Actualiza un ejercicio existente
 */
export async function updateExercise(
  exerciseId: string,
  payload: UpdateExercisePayload
): Promise<WeeklyWorkoutExercise> {
  // Validaciones
  if (payload.sets !== undefined && (payload.sets < 1 || payload.sets > 20)) {
    throw new Error('Las series deben estar entre 1 y 20');
  }
  if (payload.reps !== undefined && (payload.reps < 1 || payload.reps > 50)) {
    throw new Error('Las repeticiones deben estar entre 1 y 50');
  }
  if (payload.rest_seconds !== undefined && payload.rest_seconds !== null) {
    if (payload.rest_seconds < 0 || payload.rest_seconds > 600) {
      throw new Error('El descanso debe estar entre 0 y 600 segundos');
    }
  }

  const { data, error } = await supabase
    .from('weekly_workout_exercises')
    .update(payload)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) {
    console.error('[updateExercise] Error:', error);
    throw new Error('No se pudo actualizar el ejercicio');
  }

  return data;
}

/**
 * Elimina un ejercicio
 */
export async function deleteExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('[deleteExercise] Error:', error);
    throw new Error('No se pudo eliminar el ejercicio');
  }
}

/**
 * Reordena los ejercicios de una sesión
 */
export async function reorderExercises(sessionId: string, items: ReorderItem[]): Promise<void> {
  const updates = items.map(item =>
    supabase
      .from('weekly_workout_exercises')
      .update({ order_index: item.order_index })
      .eq('id', item.id)
      .eq('session_id', sessionId)
  );

  const results = await Promise.all(updates);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error('[reorderExercises] Errors:', errors);
    throw new Error('No se pudo reordenar los ejercicios');
  }
}
