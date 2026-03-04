// ============================================================================
// NUTRITION MODULE — TYPES
// ============================================================================

export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack';

export const MEAL_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena:     'Cena',
  snack:    'Snack',
};

export const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack'];

// ─── Domain models ───────────────────────────────────────────────────────────

export interface NutritionEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_type: MealType;
  food_name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface DayTotals {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface MealSummary extends DayTotals {
  meal_type: MealType;
  item_count: number;
}

export interface DailySummary extends DayTotals {
  entry_date: string;
  entries: NutritionEntry[];
  meal_summaries: MealSummary[];
}

export interface NutritionStats {
  avg_calories: number;
  avg_protein_g: number;
  avg_carbs_g: number;
  avg_fat_g: number;
  days_logged: number;
}

export interface NutritionEvolutionPoint {
  entry_date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface AddNutritionEntryPayload {
  entry_date?: string;
  meal_type: MealType;
  food_name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// ─── Daily goals (editable in the future) ────────────────────────────────────

export interface DailyGoal {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const DEFAULT_DAILY_GOAL: DailyGoal = {
  calories:  2000,
  protein_g: 150,
  carbs_g:   200,
  fat_g:     65,
};

// ─── Weekly diet plan ─────────────────────────────────────────────────────────

// 0 = Lunes … 6 = Domingo  (matches ISO DOW - 1)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo',
};

export const DAY_OF_WEEK_LIST: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export const MEAL_ICONS: Record<MealType, string> = {
  desayuno: '🍳',
  almuerzo: '🍲',
  cena:     '🌙',
  snack:    '🍎',
};

export interface DietPlanItem {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  food_name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  order_index: number;
  created_at: string;
}

/** diet_plan_item enriched with consumed status (from get_today_diet RPC) */
export interface TodayDietItem extends DietPlanItem {
  consumed: boolean;
  entry_id: string | null; // nutrition_entries.id if consumed
}

export interface AddDietPlanItemPayload {
  day_of_week: DayOfWeek;
  meal_type: MealType;
  food_name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  order_index?: number;
}

export interface UpdateDietPlanItemPayload {
  food_name?: string;
  grams?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}
