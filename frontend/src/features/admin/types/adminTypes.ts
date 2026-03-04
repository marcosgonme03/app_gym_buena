export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  totalWorkoutSessions: number;
  completedSessions: number;
  totalNutritionEntries: number;
  avgWorkoutsPerUser: number;
  totalWeightKg: number;
  newUsersThisWeek: number;
  newUsersLastWeek: number;
}

// ─── Retention ────────────────────────────────────────────────────────────────
export interface RetentionStats {
  day7: number;
  day14: number;
  day30: number;
  total: number; // base users with at least 1 session
}

// ─── Activity Funnel ──────────────────────────────────────────────────────────
export interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
export interface HeatmapDay {
  date: string;   // ISO YYYY-MM-DD
  count: number;
}

// ─── Platform Health / Alerts ─────────────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface PlatformAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}

// ─── Weight Progress ──────────────────────────────────────────────────────────
export interface WeightProgressPoint {
  week: string;
  totalKg: number;
}

export interface AdminUser {
  user_id: string;
  name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  role: 'admin' | 'trainer' | 'member';
  created_at: string;
  workout_count: number;
  completed_sessions: number;
}

export interface AdminWorkoutSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  session_name: string;
  workout_date: string;
  actual_duration_min?: number | null;
  total_weight_kg?: number | null;
  status: string;
  category?: string | null;
}

export interface AdminNutritionEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  entry_date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface AdminNutritionStats {
  totalEntries: number;
  avgCaloriesPerUser: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface WeeklyActivityPoint {
  week: string;
  sessions: number;
  calories: number;
  users: number;
}

export interface TopUser {
  user_id: string;
  name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  sessions: number;
  completed: number;
  totalWeightKg: number;
}

export interface ExerciseFrequency {
  exercise_name: string;
  count: number;
}

export interface DailyActivityPoint {
  day: string;
  sessions: number;
  entries: number;
}

export interface MacroDistribution {
  name: string;
  value: number;
  color: string;
}
