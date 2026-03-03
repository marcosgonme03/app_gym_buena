import { supabase } from '@/lib/supabase/client';

export interface NutritionPlanData {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks?: string | null;
  total_kcal?: number | null;
}

/**
 * Obtiene el plan nutricional del usuario para hoy.
 * Devuelve null si no tiene ninguno guardado.
 */
export async function getTodayNutritionPlan(): Promise<NutritionPlanData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('breakfast, lunch, dinner, snacks, total_kcal')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Guarda o actualiza el plan nutricional para hoy.
 */
export async function upsertTodayNutritionPlan(plan: NutritionPlanData): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('nutrition_plans')
      .upsert(
        {
          user_id: user.id,
          date: today,
          ...plan,
        },
        { onConflict: 'user_id,date' }
      );

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}
