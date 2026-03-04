// ============================================================================
// TRAINING MODULE — TYPES
// ============================================================================

export type SessionStatus = 'planned' | 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type WorkoutCategory = 'fuerza' | 'hipertrofia' | 'cardio' | 'general';

// ─── Domain models ───────────────────────────────────────────────────────────

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  category: WorkoutCategory;
  description: string | null;
  estimated_duration_min: number | null;
  exercise_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  user_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExercise[];
}

export interface WeeklyPlanDay {
  id: string;
  user_id: string;
  day_of_week: number; // 0=Mon … 6=Sun
  routine_id: string | null;
  routine?: Routine | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_date: string;
  plan_session_id: string | null;
  routine_id: string | null;
  session_name: string | null;
  category: WorkoutCategory | null;
  muscle_group: string | null;
  status: SessionStatus;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_min: number | null;
  actual_duration_min: number | null;
  total_weight_kg: number | null;
  exercise_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  user_id: string;
  exercise_name: string;
  sets_total: number;
  reps_target: number;
  weight_kg: number | null;
  sets_completed: number | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  completed_at: string | null;
  created_at: string;
}

export interface SessionWithExercises extends WorkoutSession {
  exercises: SessionExercise[];
  routine?: Routine | null;
}

export interface WorkoutStats {
  total_sessions: number;
  total_weight_kg: number;
  this_month_sessions: number;
  this_week_sessions: number;
  avg_duration_min: number | null;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  workout_date: string;
  session_name: string;
  category: WorkoutCategory;
  status: SessionStatus;
  actual_duration_min: number | null;
  total_weight_kg: number | null;
  exercise_count: number;
  routine_id: string | null;
  completed_at: string | null;
}

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface CreateRoutinePayload {
  name: string;
  category: WorkoutCategory;
  description?: string | null;
  estimated_duration_min?: number | null;
  exercises?: Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    weight_kg?: number | null;
    rest_seconds?: number | null;
    notes?: string | null;
    order_index: number;
  }>;
}

export interface CreateFreeSessionPayload {
  workout_date: string;
  session_name: string;
  category: WorkoutCategory;
  muscle_group?: string;
  estimated_duration_min?: number;
  notes?: string;
}

export interface CompleteSessionPayload {
  actual_duration_min: number;
  notes?: string | null;
}

export interface UpdateExerciseSetPayload {
  sets_completed: number;
  weight_kg?: number | null;
  completed_at?: string | null;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export interface CalendarDayData {
  date: string; // YYYY-MM-DD
  sessions: Array<{
    id: string;
    session_name: string | null;
    status: SessionStatus;
    category: WorkoutCategory | null;
  }>;
}
