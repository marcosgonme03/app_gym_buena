// ============================================================================
// NUTRITION MODULE — SERVICE LAYER
// All Supabase queries centralised here. Zero JS macro calculations.
// Views and RPCs live in nutrition-module-migration.sql and
// nutrition-diet-plan-migration.sql.
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type {
  NutritionEntry,
  DailySummary,
  MealSummary,
  MealType,
  NutritionStats,
  NutritionEvolutionPoint,
  AddNutritionEntryPayload,
  DayTotals,
  DietPlanItem,
  TodayDietItem,
  AddDietPlanItemPayload,
  UpdateDietPlanItemPayload,
  DayOfWeek,
} from '../types';
import { MEAL_TYPES } from '../types';

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuario no autenticado');
  return user.id;
}

// ─── Internal: build DailySummary from raw entries + view aggregates ─────────

function buildDailySummary(
  date: string,
  entries: NutritionEntry[],
  mealRows: MealSummary[],
): DailySummary {
  const mealSummaries: MealSummary[] = MEAL_TYPES.map((meal) => {
    const found = mealRows.find(r => r.meal_type === meal);
    return found ?? {
      meal_type:      meal as MealType,
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g:   0,
      total_fat_g:     0,
      item_count:      0,
    };
  });

  const dayTotals: DayTotals = mealSummaries.reduce(
    (acc, m) => ({
      total_calories:  acc.total_calories  + m.total_calories,
      total_protein_g: acc.total_protein_g + m.total_protein_g,
      total_carbs_g:   acc.total_carbs_g   + m.total_carbs_g,
      total_fat_g:     acc.total_fat_g     + m.total_fat_g,
    }),
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 },
  );

  return {
    entry_date:    date,
    entries,
    meal_summaries: mealSummaries,
    ...dayTotals,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getTodaySummary — entries + meal aggregates for today
// ─────────────────────────────────────────────────────────────────────────────

export async function getTodaySummary(): Promise<DailySummary> {
  const today = new Date().toISOString().split('T')[0];
  return getDailySummary(today);
}

// ─────────────────────────────────────────────────────────────────────────────
// getDailySummary — entries + meal aggregates for any date
// ─────────────────────────────────────────────────────────────────────────────

export async function getDailySummary(date: string): Promise<DailySummary> {
  const userId = await getUserId();

  const [entriesResult, summaryResult] = await Promise.all([
    // Raw entries for the day (for the food-item lists per meal)
    supabase
      .from('nutrition_entries')
      .select('*')
      .eq('user_id',   userId)
      .eq('entry_date', date)
      .order('created_at', { ascending: true }),

    // Aggregated macros per meal from the view (calculated by SQL)
    supabase
      .from('v_daily_nutrition_summary')
      .select('meal_type, total_calories, total_protein_g, total_carbs_g, total_fat_g, item_count')
      .eq('user_id',   userId)
      .eq('entry_date', date),
  ]);

  if (entriesResult.error) throw new Error('No se pudieron cargar las entradas');
  if (summaryResult.error) throw new Error('No se pudieron cargar los resúmenes');

  const entries  = (entriesResult.data  || []) as NutritionEntry[];
  const mealRows = (summaryResult.data || []) as MealSummary[];

  return buildDailySummary(date, entries, mealRows);
}

// ─────────────────────────────────────────────────────────────────────────────
// getNutritionStats — 30-day averages via RPC
// ─────────────────────────────────────────────────────────────────────────────

export async function getNutritionStats(): Promise<NutritionStats> {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc('get_nutrition_stats', { p_user_id: userId });

  if (error || !data?.[0]) {
    // Return zeroed stats if missing (new user)
    return { avg_calories: 0, avg_protein_g: 0, avg_carbs_g: 0, avg_fat_g: 0, days_logged: 0 };
  }

  const r = data[0] as any;
  return {
    avg_calories:  Number(r.avg_calories)  || 0,
    avg_protein_g: Number(r.avg_protein_g) || 0,
    avg_carbs_g:   Number(r.avg_carbs_g)   || 0,
    avg_fat_g:     Number(r.avg_fat_g)     || 0,
    days_logged:   Number(r.days_logged)   || 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getNutritionEvolution — last 30 days via RPC
// ─────────────────────────────────────────────────────────────────────────────

export async function getNutritionEvolution(days = 30): Promise<NutritionEvolutionPoint[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc('get_nutrition_evolution', {
    p_user_id: userId,
    p_days:    days,
  });

  if (error) throw new Error('No se pudo cargar la evolución nutricional');

  return (data || []).map((r: any) => ({
    entry_date:      r.entry_date,
    total_calories:  Number(r.total_calories)  || 0,
    total_protein_g: Number(r.total_protein_g) || 0,
    total_carbs_g:   Number(r.total_carbs_g)   || 0,
    total_fat_g:     Number(r.total_fat_g)     || 0,
  })) as NutritionEvolutionPoint[];
}

// ─────────────────────────────────────────────────────────────────────────────
// addNutritionEntry — insert one food item
// ─────────────────────────────────────────────────────────────────────────────

export async function addNutritionEntry(
  payload: AddNutritionEntryPayload,
): Promise<NutritionEntry> {
  const userId = await getUserId();
  const today  = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('nutrition_entries')
    .insert({
      user_id:    userId,
      entry_date: payload.entry_date ?? today,
      meal_type:  payload.meal_type,
      food_name:  payload.food_name.trim(),
      grams:      payload.grams,
      calories:   payload.calories,
      protein_g:  payload.protein_g,
      carbs_g:    payload.carbs_g,
      fat_g:      payload.fat_g,
    })
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo añadir el alimento');
  return data as NutritionEntry;
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteNutritionEntry — remove one food item
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteNutritionEntry(id: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('nutrition_entries')
    .delete()
    .eq('id',      id)
    .eq('user_id', userId);

  if (error) throw new Error('No se pudo eliminar el alimento');
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── WEEKLY DIET PLAN ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// getWeeklyDietPlan — returns all items grouped by day_of_week
// ─────────────────────────────────────────────────────────────────────────────

export async function getWeeklyDietPlan(): Promise<Record<DayOfWeek, DietPlanItem[]>> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('diet_plan_items')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('order_index',  { ascending: true })
    .order('created_at',   { ascending: true });

  if (error) throw new Error('No se pudo cargar el plan semanal');

  const plan = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } as Record<DayOfWeek, DietPlanItem[]>;
  for (const row of (data || []) as DietPlanItem[]) {
    plan[row.day_of_week as DayOfWeek].push(row);
  }
  return plan;
}

// ─────────────────────────────────────────────────────────────────────────────
// getTodayDiet — today's plan items with consumed flag (via RPC)
// ─────────────────────────────────────────────────────────────────────────────

export async function getTodayDiet(): Promise<TodayDietItem[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc('get_today_diet', { p_user_id: userId });

  if (error) throw new Error('No se pudo cargar la dieta de hoy');

  return (data || []).map((r: any) => ({
    id:           r.id,
    user_id:      userId,
    day_of_week:  r.day_of_week   as DayOfWeek,
    meal_type:    r.meal_type     as MealType,
    food_name:    r.food_name,
    grams:        Number(r.grams)     || 0,
    calories:     Number(r.calories)  || 0,
    protein_g:    Number(r.protein_g) || 0,
    carbs_g:      Number(r.carbs_g)   || 0,
    fat_g:        Number(r.fat_g)     || 0,
    order_index:  Number(r.order_index) || 0,
    created_at:   '',
    consumed:     Boolean(r.consumed),
    entry_id:     r.entry_id ?? null,
  })) as TodayDietItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// addDietPlanItem — insert one item into the weekly plan
// ─────────────────────────────────────────────────────────────────────────────

export async function addDietPlanItem(payload: AddDietPlanItemPayload): Promise<DietPlanItem> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('diet_plan_items')
    .insert({
      user_id:     userId,
      day_of_week: payload.day_of_week,
      meal_type:   payload.meal_type,
      food_name:   payload.food_name.trim(),
      grams:       payload.grams,
      calories:    payload.calories,
      protein_g:   payload.protein_g,
      carbs_g:     payload.carbs_g,
      fat_g:       payload.fat_g,
      order_index: payload.order_index ?? 0,
    })
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo añadir el alimento al plan');
  return data as DietPlanItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// updateDietPlanItem — patch one item in the weekly plan
// ─────────────────────────────────────────────────────────────────────────────

export async function updateDietPlanItem(
  id: string,
  payload: UpdateDietPlanItemPayload,
): Promise<DietPlanItem> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('diet_plan_items')
    .update(payload)
    .eq('id',      id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo actualizar el alimento');
  return data as DietPlanItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteDietPlanItem — remove one item from the weekly plan
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteDietPlanItem(id: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('diet_plan_items')
    .delete()
    .eq('id',      id)
    .eq('user_id', userId);

  if (error) throw new Error('No se pudo eliminar el alimento del plan');
}

// ─────────────────────────────────────────────────────────────────────────────
// markDietItemConsumed — inserts a nutrition_entry linked to the plan item
// ─────────────────────────────────────────────────────────────────────────────

export async function markDietItemConsumed(item: TodayDietItem): Promise<NutritionEntry> {
  const userId = await getUserId();
  const today  = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('nutrition_entries')
    .insert({
      user_id:             userId,
      entry_date:          today,
      meal_type:           item.meal_type,
      food_name:           item.food_name,
      grams:               item.grams,
      calories:            item.calories,
      protein_g:           item.protein_g,
      carbs_g:             item.carbs_g,
      fat_g:               item.fat_g,
      source_plan_item_id: item.id,
    })
    .select()
    .single();

  if (error || !data) throw new Error('No se pudo registrar como consumido');
  return data as NutritionEntry;
}

// ─────────────────────────────────────────────────────────────────────────────
// unmarkDietItemConsumed — deletes the nutrition_entry linked to the plan item
// ─────────────────────────────────────────────────────────────────────────────

export async function unmarkDietItemConsumed(entryId: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('nutrition_entries')
    .delete()
    .eq('id',      entryId)
    .eq('user_id', userId);

  if (error) throw new Error('No se pudo desmarcar el alimento');
}
