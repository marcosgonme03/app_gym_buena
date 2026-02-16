import { supabase } from '@/lib/supabase/client';
import { WorkoutLog, WeeklyStats } from '@/lib/supabase/types';
import { getWeekDays } from '@/features/member/workoutPlan/weekHelpers';

/**
 * Servicio para gestionar workout_logs (registros de entrenamientos)
 * FASE 2: Tracking semanal y racha de entrenamientos
 */

// ============================================
// 1. OBTENER META SEMANAL DEL USUARIO
// ============================================
export async function getWeeklyWorkoutGoal(userId?: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user && !userId) {
      throw new Error('Usuario no autenticado');
    }

    const targetUserId = userId || user!.id;

    const { data, error } = await supabase
      .from('users')
      .select('weekly_workout_goal')
      .eq('user_id', targetUserId)
      .single();

    if (error) throw error;

    return data?.weekly_workout_goal || 3; // Default 3 si no está definido
  } catch (error: any) {
    console.error('[workoutLogs] Error al obtener meta semanal:', error);
    return 3; // Fallback seguro
  }
}

// ============================================
// 2. CONTAR ENTRENAMIENTOS DE LA SEMANA
// ============================================
export async function getWeeklyWorkoutCount(userId?: string, weekStart?: string, weekEnd?: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user && !userId) {
      throw new Error('Usuario no autenticado');
    }

    const targetUserId = userId || user!.id;

    let startISO: string;
    let endISO: string;

    if (weekStart && weekEnd) {
      // Usar el rango proporcionado
      startISO = new Date(weekStart).toISOString();
      const endDate = new Date(weekEnd);
      endDate.setHours(23, 59, 59, 999);
      endISO = endDate.toISOString();
    } else {
      // Calcular inicio de semana (lunes a las 00:00) - semana actual
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, retrocede 6 días
      
      const start = new Date(now);
      start.setDate(now.getDate() + daysToMonday);
      start.setHours(0, 0, 0, 0);
      startISO = start.toISOString();

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      endISO = end.toISOString();
    }

    // console.log('[workoutLogs] Contando desde:', startISO, 'hasta:', endISO);

    // Contar logs en el rango
    const { count, error } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .gte('performed_at', startISO)
      .lte('performed_at', endISO);

    if (error) throw error;

    // console.log('[workoutLogs] Entrenamientos en la semana:', count);
    return count || 0;
  } catch (error: any) {
    console.error('[workoutLogs] Error al contar entrenamientos:', error);
    return 0;
  }
}

// ============================================
// 3. CALCULAR RACHA ACTUAL (DÍAS CONSECUTIVOS)
// ============================================
export async function getCurrentStreak(userId?: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user && !userId) {
      throw new Error('Usuario no autenticado');
    }

    const targetUserId = userId || user!.id;

    // Obtener logs de los últimos 45 días
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const { data: logs, error } = await supabase
      .from('workout_logs')
      .select('performed_at')
      .eq('user_id', targetUserId)
      .gte('performed_at', fortyFiveDaysAgo.toISOString())
      .order('performed_at', { ascending: false });

    if (error) throw error;
    if (!logs || logs.length === 0) return 0;

    // Convertir a días únicos (YYYY-MM-DD)
    const uniqueDays = new Set<string>();
    logs.forEach(log => {
      const date = new Date(log.performed_at);
      const dayString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      uniqueDays.add(dayString);
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse(); // Más reciente primero

    // Calcular racha hacia atrás desde hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentCheckDate = new Date(today);

    for (let i = 0; i < 45; i++) {
      const checkDateString = currentCheckDate.toISOString().split('T')[0];
      
      if (sortedDays.includes(checkDateString)) {
        streak++;
      } else if (streak > 0) {
        // Si ya empezó la racha y encontramos un día sin entreno, termina
        break;
      }
      // Si todavía no ha empezado la racha (streak === 0), seguimos buscando hacia atrás
      
      // Retroceder un día
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }

    // console.log('[workoutLogs] Racha actual:', streak, 'días');
    return streak;
  } catch (error: any) {
    console.error('[workoutLogs] Error al calcular racha:', error);
    return 0;
  }
}

// ============================================
// 4. INSERTAR NUEVO WORKOUT LOG
// ============================================
export interface InsertWorkoutLogPayload {
  workout_type?: string | null;
  notes?: string | null;
  performed_at?: string; // Si no se proporciona, usa NOW()
}

export async function insertWorkoutLog(payload: InsertWorkoutLogPayload = {}): Promise<WorkoutLog> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const insertData = {
      user_id: user.id,
      performed_at: payload.performed_at || new Date().toISOString(),
      workout_type: payload.workout_type || null,
      notes: payload.notes || null
    };

    // console.log('[workoutLogs] Insertando workout log:', insertData);

    const { data, error } = await supabase
      .from('workout_logs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // console.log('[workoutLogs] ✅ Workout log insertado:', data);
    
    // Validación adicional
    console.assert(data?.id, 'Insert debe devolver fila con id');
    console.assert(data?.user_id === user.id, 'user_id debe coincidir con auth.uid()');

    return data;
  } catch (error: any) {
    console.error('[workoutLogs] ❌ Error al insertar workout log:', error);
    throw new Error(error.message || 'Error al registrar entrenamiento');
  }
}

// ============================================
// 5. OBTENER ESTADÍSTICAS SEMANALES COMPLETAS
// ============================================
export async function getWeeklyStats(userId?: string, weekStart?: string, weekEnd?: string): Promise<WeeklyStats> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!targetUserId) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener datos en paralelo
    const [weeklyGoal, weeklyCount, streakDays] = await Promise.all([
      getWeeklyWorkoutGoal(targetUserId),
      getWeeklyWorkoutCount(targetUserId, weekStart, weekEnd),
      getCurrentStreak(targetUserId)
    ]);

    // Calcular porcentaje
    const weeklyPercent = weeklyGoal > 0 
      ? Math.min(Math.round((weeklyCount / weeklyGoal) * 100), 100)
      : 0;

    // Validaciones en dev
    console.assert(!isNaN(weeklyCount), 'weeklyCount no debe ser NaN');
    console.assert(!isNaN(weeklyGoal), 'weeklyGoal no debe ser NaN');
    console.assert(!isNaN(streakDays), 'streakDays no debe ser NaN');
    console.assert(weeklyGoal >= 1 && weeklyGoal <= 14, 'weeklyGoal debe estar entre 1 y 14');

    const stats: WeeklyStats = {
      weeklyCount: weeklyCount || 0,
      weeklyGoal: weeklyGoal || 3,
      weeklyPercent: weeklyPercent || 0,
      streakDays: streakDays || 0,
      nextBookedClass: null // TODO: Implementar cuando exista tabla bookings
    };

    // console.log('[workoutLogs] ✅ Estadísticas semanales:', stats);

    return stats;
  } catch (error: any) {
    console.error('[workoutLogs] Error al obtener estadísticas semanales:', error);
    
    // Retornar estado seguro en caso de error
    return {
      weeklyCount: 0,
      weeklyGoal: 3,
      weeklyPercent: 0,
      streakDays: 0,
      nextBookedClass: null
    };
  }
}

// ============================================
// 6. OBTENER HISTORIAL DE WORKOUT LOGS
// ============================================
export async function getMyWorkoutLogs(limit: number = 30): Promise<WorkoutLog[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('[workoutLogs] Error al obtener historial:', error);
    return [];
  }
}

// ============================================
// 7. ELIMINAR WORKOUT LOG
// ============================================
export async function deleteWorkoutLog(logId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id); // RLS: solo puede borrar sus propios logs

    if (error) throw error;

    // console.log('[workoutLogs] ✅ Workout log eliminado:', logId);
  } catch (error: any) {
    console.error('[workoutLogs] ❌ Error al eliminar workout log:', error);
    throw new Error(error.message || 'Error al eliminar registro de entrenamiento');
  }
}

// ============================================
// 8. CONTAR WORKOUT LOGS EN UN DÍA
// ============================================
export async function getWorkoutCountForDate(date: string, userId?: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !userId) {
      throw new Error('Usuario no autenticado');
    }

    const targetUserId = userId || user!.id;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const { count, error } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .gte('performed_at', dayStart.toISOString())
      .lte('performed_at', dayEnd.toISOString());

    if (error) throw error;

    return count || 0;
  } catch (error: any) {
    console.error('[workoutLogs] Error al contar entrenos por día:', error);
    return 0;
  }
}

export interface WeeklyWorkoutDistributionPoint {
  date: string;
  label: string;
  completed: number;
}

// ============================================
// 9. DISTRIBUCIÓN SEMANAL L-D
// ============================================
export async function getWeeklyWorkoutDistribution(
  weekStart: string,
  userId?: string
): Promise<WeeklyWorkoutDistributionPoint[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !userId) {
      throw new Error('Usuario no autenticado');
    }

    const targetUserId = userId || user!.id;
    const weekDays = getWeekDays(weekStart);
    const weekEnd = weekDays[6];

    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('workout_logs')
      .select('performed_at')
      .eq('user_id', targetUserId)
      .gte('performed_at', start.toISOString())
      .lte('performed_at', end.toISOString());

    if (error) throw error;

    const completedByDate = new Map<string, number>();

    (data || []).forEach((log) => {
      const dateKey = new Date(log.performed_at).toISOString().split('T')[0];
      const current = completedByDate.get(dateKey) || 0;
      completedByDate.set(dateKey, current + 1);
    });

    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return weekDays.map((date, index) => ({
      date,
      label: labels[index],
      completed: completedByDate.get(date) || 0
    }));
  } catch (error: any) {
    console.error('[workoutLogs] Error al obtener distribución semanal:', error);
    const weekDays = getWeekDays(weekStart);
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return weekDays.map((date, index) => ({ date, label: labels[index], completed: 0 }));
  }
}
