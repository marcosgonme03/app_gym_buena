// ============================================================================
// TIPOS PARA SISTEMA DE PLANIFICACIÓN SEMANAL
// ============================================================================

// Interfaces base de las tablas
export interface WeeklyWorkoutPlan {
  id: string;
  user_id: string;
  week_start: string; // ISO date string (YYYY-MM-DD)
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyWorkoutSession {
  id: string;
  plan_id: string;
  user_id: string;
  session_date: string; // ISO date string (YYYY-MM-DD)
  name: string;
  notes: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyWorkoutExercise {
  id: string;
  session_id: string;
  user_id: string;
  exercise_name: string;
  sets: number; // 1-20
  reps: number; // 1-50
  rest_seconds: number | null; // 0-600
  notes: string | null;
  order_index: number;
  created_at: string;
}

// ============================================================================
// DTOs Y PAYLOADS
// ============================================================================

// Payload para crear/actualizar plan
export interface UpsertPlanMetaPayload {
  title?: string | null;
  notes?: string | null;
}

// Payload para crear sesión
export interface CreateSessionPayload {
  plan_id: string;
  session_date: string; // YYYY-MM-DD
  name: string;
  notes?: string | null;
  order_index?: number;
}

// Payload para actualizar sesión
export interface UpdateSessionPayload {
  session_date?: string;
  name?: string;
  notes?: string | null;
  order_index?: number;
}

// Payload para crear ejercicio
export interface CreateExercisePayload {
  session_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
}

// Payload para actualizar ejercicio
export interface UpdateExercisePayload {
  exercise_name?: string;
  sets?: number;
  reps?: number;
  rest_seconds?: number | null;
  notes?: string | null;
  order_index?: number;
}

// Payload para reordenar
export interface ReorderItem {
  id: string;
  order_index: number;
}

// ============================================================================
// DTO COMPLETO (plan + sesiones + ejercicios)
// ============================================================================

export interface SessionWithExercises extends WeeklyWorkoutSession {
  exercises: WeeklyWorkoutExercise[];
}

export interface WeeklyPlanFullDTO {
  plan: WeeklyWorkoutPlan;
  sessions: SessionWithExercises[];
}

// ============================================================================
// TIPOS PARA UI
// ============================================================================

export interface WeekInfo {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  displayRange: string; // "22–28 Ene 2026"
  isCurrentWeek: boolean;
}

// Estado del planificador
export interface WorkoutPlanState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  weekInfo: WeekInfo;
  planData: WeeklyPlanFullDTO | null;
}
