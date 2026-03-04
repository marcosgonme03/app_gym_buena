// ============================================================================
// PROGRESS MODULE — TYPES
// ============================================================================

export interface ProgressStats {
  total_sessions: number;
  total_weight_kg: number;
  this_month_sessions: number;
  this_week_sessions: number;
  avg_duration_min: number | null;
  months_active: number;
}

export interface PersonalRecord {
  exercise_name: string;
  max_weight_kg: number;
  total_exercises: number; // cuántas veces aparece en ejercicios registrados
  date: string;            // fecha de la sesión con ese máximo
  session_id: string;
}

export interface MostFrequentExercise {
  exercise_name: string;
  total_times: number;
}

export interface EvolutionPoint {
  week_label: string;   // "S1", "S2", ...
  week_start: string;   // ISO date
  total_weight_kg: number;
  session_count: number;
}

export interface RecentSession {
  id: string;
  workout_date: string;
  session_name: string;
  category: string;
  status: string;
  actual_duration_min: number | null;
  total_weight_kg: number | null;
  exercise_count: number;
}

export interface ProgressData {
  stats: ProgressStats;
  records: PersonalRecord[];
  mostFrequent: MostFrequentExercise | null;
  evolution: EvolutionPoint[];
  recentSessions: RecentSession[];
}
