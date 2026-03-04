import { supabase } from '@/lib/supabase/client';
import type {
  AdminStats,
  AdminUser,
  AdminWorkoutSession,
  AdminNutritionEntry,
  AdminNutritionStats,
  ChartDataPoint,
  WeeklyActivityPoint,
  TopUser,
  ExerciseFrequency,
  DailyActivityPoint,
  RetentionStats,
  FunnelStep,
  HeatmapDay,
  PlatformAlert,
  WeightProgressPoint,
} from '../types/adminTypes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

// ─── Stats globales ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const today = toISODate(new Date());
  const thisWeekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);
  const thirtyDaysAgo = daysAgo(30);

  const [
    { count: totalUsers },
    { count: totalSessions },
    { count: completedSessions },
    { count: totalNutrition },
    { count: newThisWeek },
    { count: newLastWeek },
    weightResult,
    activeTodayResult,
    activeWeekResult,
    activeMonthResult,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('nutrition_entries').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thisWeekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', lastWeekStart).lt('created_at', thisWeekStart),
    supabase.from('workout_sessions').select('total_weight_kg').eq('status', 'completed').not('total_weight_kg', 'is', null),
    supabase.from('workout_sessions').select('user_id').eq('workout_date', today),
    supabase.from('workout_sessions').select('user_id').gte('workout_date', thisWeekStart),
    supabase.from('workout_sessions').select('user_id').gte('workout_date', thirtyDaysAgo),
  ]);

  const totalWeightKg = (weightResult.data ?? []).reduce(
    (sum: number, r: { total_weight_kg: number | null }) => sum + (r.total_weight_kg ?? 0),
    0
  );

  const activeToday = new Set((activeTodayResult.data ?? []).map((r: { user_id: string }) => r.user_id)).size;
  const activeWeek = new Set((activeWeekResult.data ?? []).map((r: { user_id: string }) => r.user_id)).size;
  const activeMonth = new Set((activeMonthResult.data ?? []).map((r: { user_id: string }) => r.user_id)).size;
  const users = totalUsers ?? 0;
  const completed = completedSessions ?? 0;
  const avgWorkouts = users > 0 ? Math.round((completed / users) * 10) / 10 : 0;

  return {
    totalUsers: users,
    activeUsers: activeMonth,
    activeUsersToday: activeToday,
    activeUsersThisWeek: activeWeek,
    activeUsersThisMonth: activeMonth,
    totalWorkoutSessions: totalSessions ?? 0,
    completedSessions: completed,
    totalNutritionEntries: totalNutrition ?? 0,
    avgWorkoutsPerUser: avgWorkouts,
    totalWeightKg: Math.round(totalWeightKg),
    newUsersThisWeek: newThisWeek ?? 0,
    newUsersLastWeek: newLastWeek ?? 0,
  };
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, name, last_name, email, avatar_url, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!users) return [];

  const { data: sessionCounts } = await supabase
    .from('workout_sessions')
    .select('user_id, status');

  const countMap = new Map<string, { total: number; completed: number }>();
  (sessionCounts ?? []).forEach((s: { user_id: string; status: string }) => {
    const entry = countMap.get(s.user_id) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (s.status === 'completed') entry.completed += 1;
    countMap.set(s.user_id, entry);
  });

  return users.map((u) => ({
    ...u,
    workout_count: countMap.get(u.user_id)?.total ?? 0,
    completed_sessions: countMap.get(u.user_id)?.completed ?? 0,
  }));
}

export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'trainer' | 'member'
): Promise<void> {
  const { error } = await supabase.from('users').update({ role: newRole }).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// ─── Workout sessions ─────────────────────────────────────────────────────────

export async function getAdminWorkoutSessions(limit = 60): Promise<AdminWorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, user_id, session_name, workout_date, actual_duration_min, total_weight_kg, status, category')
    .order('workout_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!data) return [];

  const userIds = [...new Set(data.map((d) => d.user_id))];
  const { data: usersData } = await supabase
    .from('users')
    .select('user_id, name, last_name, email')
    .in('user_id', userIds);

  const usersMap = new Map(
    (usersData ?? []).map((u: { user_id: string; name: string; last_name: string; email: string }) => [
      u.user_id,
      { name: `${u.name} ${u.last_name}`, email: u.email },
    ])
  );

  return data.map((s) => ({
    ...s,
    session_name: s.session_name ?? 'Sin nombre',
    user_name: usersMap.get(s.user_id)?.name ?? 'Desconocido',
    user_email: usersMap.get(s.user_id)?.email ?? '',
  }));
}

export async function getWorkoutStats() {
  const [{ count: total }, { count: completed }, { count: thisWeek }] = await Promise.all([
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).gte('workout_date', daysAgo(7)),
  ]);

  return { total: total ?? 0, completed: completed ?? 0, thisWeek: thisWeek ?? 0 };
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export async function getAdminNutritionEntries(limit = 60): Promise<AdminNutritionEntry[]> {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('id, user_id, entry_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g')
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!data) return [];

  const userIds = [...new Set(data.map((d) => d.user_id))];
  const { data: usersData } = await supabase
    .from('users')
    .select('user_id, name, last_name, email')
    .in('user_id', userIds);

  const usersMap = new Map(
    (usersData ?? []).map((u: { user_id: string; name: string; last_name: string; email: string }) => [
      u.user_id,
      { name: `${u.name} ${u.last_name}`, email: u.email },
    ])
  );

  return data.map((e) => ({
    ...e,
    user_name: usersMap.get(e.user_id)?.name ?? 'Desconocido',
    user_email: usersMap.get(e.user_id)?.email ?? '',
  }));
}

export async function getAdminNutritionStats(): Promise<AdminNutritionStats> {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('user_id, calories, protein_g, carbs_g, fat_g');

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    return { totalEntries: 0, avgCaloriesPerUser: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
  }

  const uniqueUsers = new Set(data.map((d: { user_id: string }) => d.user_id)).size;
  const totalCal = data.reduce((s: number, d: { calories: number }) => s + (d.calories ?? 0), 0);

  return {
    totalEntries: data.length,
    avgCaloriesPerUser: uniqueUsers > 0 ? Math.round(totalCal / uniqueUsers) : 0,
    totalProtein: Math.round(data.reduce((s: number, d: { protein_g: number }) => s + (d.protein_g ?? 0), 0)),
    totalCarbs: Math.round(data.reduce((s: number, d: { carbs_g: number }) => s + (d.carbs_g ?? 0), 0)),
    totalFat: Math.round(data.reduce((s: number, d: { fat_g: number }) => s + (d.fat_g ?? 0), 0)),
  };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getUserGrowthChart(): Promise<ChartDataPoint[]> {
  const now = new Date();
  const results: ChartDataPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const label = start.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', toISODate(end));
    results.push({ label, value: count ?? 0 });
  }
  return results;
}

export async function getWeeklySessionsChart(): Promise<ChartDataPoint[]> {
  const now = new Date();
  const results: ChartDataPoint[] = [];

  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const { count } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('workout_date', toISODate(start))
      .lte('workout_date', toISODate(end))
      .eq('status', 'completed');
    results.push({ label: `S${8 - i}`, value: count ?? 0 });
  }
  return results;
}

export async function getWeeklyActivity(): Promise<WeeklyActivityPoint[]> {
  const now = new Date();
  const results: WeeklyActivityPoint[] = [];

  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const weekStart = toISODate(start);
    const weekEnd = toISODate(end);

    const [{ count: sessions }, nutritionResult, { count: newUsers }] = await Promise.all([
      supabase.from('workout_sessions').select('*', { count: 'exact', head: true })
        .gte('workout_date', weekStart).lte('workout_date', weekEnd),
      supabase.from('nutrition_entries').select('calories')
        .gte('entry_date', weekStart).lte('entry_date', weekEnd),
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart).lte('created_at', weekEnd),
    ]);

    const totalCal = (nutritionResult.data ?? []).reduce(
      (s: number, r: { calories: number }) => s + (r.calories ?? 0), 0
    );

    results.push({
      week: `S${8 - i}`,
      sessions: sessions ?? 0,
      calories: Math.round(totalCal),
      users: newUsers ?? 0,
    });
  }
  return results;
}

export async function getRecentActivity() {
  const [sessResult, nutritionResult] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('id, user_id, session_name, status, created_at, users:user_id(name, last_name)')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('nutrition_entries')
      .select('id, user_id, food_name, meal_type, created_at, users:user_id(name, last_name)')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  type LogEntry = {
    id: string; user_id: string; user_name: string;
    action: string; table_name: string; created_at: string;
  };

  const sessLogs: LogEntry[] = (sessResult.data ?? []).map((s: Record<string, unknown>) => {
    const user = s.users as { name: string; last_name: string } | null;
    return {
      id: `sess-${s.id}`,
      user_id: s.user_id as string,
      user_name: user ? `${user.name} ${user.last_name}` : 'Desconocido',
      action: `Sesión "${(s.session_name as string) || 'sin nombre'}" — ${s.status}`,
      table_name: 'workout_sessions',
      created_at: s.created_at as string,
    };
  });

  const nutritionLogs: LogEntry[] = (nutritionResult.data ?? []).map((e: Record<string, unknown>) => {
    const user = e.users as { name: string; last_name: string } | null;
    return {
      id: `nut-${e.id}`,
      user_id: e.user_id as string,
      user_name: user ? `${user.name} ${user.last_name}` : 'Desconocido',
      action: `Registró "${e.food_name}" (${e.meal_type})`,
      table_name: 'nutrition_entries',
      created_at: e.created_at as string,
    };
  });

  return [...sessLogs, ...nutritionLogs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 40);
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function getTopActiveUsers(limit = 8): Promise<TopUser[]> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('user_id, status, total_weight_kg');

  if (!sessions) return [];

  const map = new Map<string, { sessions: number; completed: number; totalWeightKg: number }>();
  sessions.forEach((s: { user_id: string; status: string; total_weight_kg: number | null }) => {
    const e = map.get(s.user_id) ?? { sessions: 0, completed: 0, totalWeightKg: 0 };
    e.sessions += 1;
    if (s.status === 'completed') e.completed += 1;
    e.totalWeightKg += s.total_weight_kg ?? 0;
    map.set(s.user_id, e);
  });

  const topIds = [...map.entries()]
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, limit)
    .map(([id]) => id);

  if (!topIds.length) return [];

  const { data: users } = await supabase
    .from('users')
    .select('user_id, name, last_name, email, avatar_url')
    .in('user_id', topIds);

  return (users ?? []).map((u) => {
    const stats = map.get(u.user_id)!;
    return {
      user_id: u.user_id,
      name: u.name,
      last_name: u.last_name,
      email: u.email,
      avatar_url: u.avatar_url,
      sessions: stats.sessions,
      completed: stats.completed,
      totalWeightKg: Math.round(stats.totalWeightKg),
    };
  }).sort((a, b) => b.sessions - a.sessions);
}

// ─── Recent data ──────────────────────────────────────────────────────────────

export async function getRecentWorkouts(limit = 8): Promise<AdminWorkoutSession[]> {
  return getAdminWorkoutSessions(limit);
}

export async function getRecentNutritionEntries(limit = 8): Promise<AdminNutritionEntry[]> {
  return getAdminNutritionEntries(limit);
}

// ─── Exercise frequency ───────────────────────────────────────────────────────

export async function getExerciseFrequency(limit = 8): Promise<ExerciseFrequency[]> {
  const { data } = await supabase
    .from('session_exercises')
    .select('exercise_name');

  if (!data || data.length === 0) return [];

  const freq = new Map<string, number>();
  data.forEach((r: { exercise_name: string }) => {
    if (!r.exercise_name) return;
    freq.set(r.exercise_name, (freq.get(r.exercise_name) ?? 0) + 1);
  });

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([exercise_name, count]) => ({ exercise_name, count }));
}

// ─── Daily activity (last 14 days) ───────────────────────────────────────────

export async function getDailyActivity(): Promise<DailyActivityPoint[]> {
  const results: DailyActivityPoint[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = toISODate(d);
    const label = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

    const [{ count: sessions }, { count: entries }] = await Promise.all([
      supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('workout_date', day),
      supabase.from('nutrition_entries').select('*', { count: 'exact', head: true }).eq('entry_date', day),
    ]);

    results.push({ day: label, sessions: sessions ?? 0, entries: entries ?? 0 });
  }

  return results;
}

// ─── Workout analytics ────────────────────────────────────────────────────────

export async function getWorkoutAnalytics() {
  const [exerciseFreq, weeklyChart, stats] = await Promise.all([
    getExerciseFrequency(10),
    getWeeklySessionsChart(),
    getWorkoutStats(),
  ]);

  return { exerciseFreq, weeklyChart, stats };
}

// ─── Nutrition analytics ─────────────────────────────────────────────────────

export async function getNutritionAnalytics() {
  const [macroStats, weeklyNutrition] = await Promise.all([
    getAdminNutritionStats(),
    (async (): Promise<ChartDataPoint[]> => {
      const now = new Date();
      const results: ChartDataPoint[] = [];
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const { data } = await supabase
          .from('nutrition_entries')
          .select('calories')
          .gte('entry_date', toISODate(start))
          .lte('entry_date', toISODate(end));
        const total = (data ?? []).reduce((s: number, d: { calories: number }) => s + (d.calories ?? 0), 0);
        results.push({ label: `S${8 - i}`, value: Math.round(total) });
      }
      return results;
    })(),
  ]);

  return { macroStats, weeklyNutrition };
}

// ─── Retention ────────────────────────────────────────────────────────────────

export async function getRetentionStats(): Promise<RetentionStats> {
  // Get all users who have at least 1 session
  const { data: firstSessions } = await supabase
    .from('workout_sessions')
    .select('user_id, workout_date')
    .order('workout_date', { ascending: true });

  if (!firstSessions || firstSessions.length === 0) {
    return { day7: 0, day14: 0, day30: 0, total: 0 };
  }

  // Find first session date per user
  const firstByUser = new Map<string, string>();
  firstSessions.forEach((s: { user_id: string; workout_date: string }) => {
    if (!firstByUser.has(s.user_id)) firstByUser.set(s.user_id, s.workout_date);
  });

  const total = firstByUser.size;
  let ret7 = 0, ret14 = 0, ret30 = 0;

  // For each user, check if they have a session at least N days after their first
  const allSessions = new Map<string, string[]>();
  firstSessions.forEach((s: { user_id: string; workout_date: string }) => {
    const arr = allSessions.get(s.user_id) ?? [];
    arr.push(s.workout_date);
    allSessions.set(s.user_id, arr);
  });

  firstByUser.forEach((firstDate, userId) => {
    const sessions = allSessions.get(userId) ?? [];
    const firstMs = new Date(firstDate).getTime();
    const hasMsAfter = (days: number) =>
      sessions.some((d) => new Date(d).getTime() >= firstMs + days * 86400000);

    if (hasMsAfter(7)) ret7++;
    if (hasMsAfter(14)) ret14++;
    if (hasMsAfter(30)) ret30++;
  });

  return {
    day7: total > 0 ? Math.round((ret7 / total) * 100) : 0,
    day14: total > 0 ? Math.round((ret14 / total) * 100) : 0,
    day30: total > 0 ? Math.round((ret30 / total) * 100) : 0,
    total,
  };
}

// ─── Activity Funnel ──────────────────────────────────────────────────────────

export async function getActivityFunnel(): Promise<FunnelStep[]> {
  const [
    { count: registered },
    routinesResult,
    { count: hasSessions },
    nutritionResult,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('workout_sessions').select('user_id'),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('nutrition_entries').select('user_id'),
  ]);

  const usersWithRoutines = new Set((routinesResult.data ?? []).map((r: { user_id: string }) => r.user_id)).size;
  const usersWithNutrition = new Set((nutritionResult.data ?? []).map((r: { user_id: string }) => r.user_id)).size;

  return [
    { label: 'Registrados', value: registered ?? 0, color: '#6366f1' },
    { label: 'Con rutinas', value: usersWithRoutines, color: '#22d3ee' },
    { label: 'Sesión completada', value: hasSessions ?? 0, color: '#10b981' },
    { label: 'Nutrición registrada', value: usersWithNutrition, color: '#f97316' },
  ];
}

// ─── Heatmap (last 52 weeks = 364 days) ──────────────────────────────────────

export async function getActivityHeatmap(): Promise<HeatmapDay[]> {
  const startDate = daysAgo(364);
  const { data } = await supabase
    .from('workout_sessions')
    .select('workout_date')
    .gte('workout_date', startDate);

  const countMap = new Map<string, number>();
  (data ?? []).forEach((r: { workout_date: string }) => {
    const d = r.workout_date.split('T')[0];
    countMap.set(d, (countMap.get(d) ?? 0) + 1);
  });

  const result: HeatmapDay[] = [];
  const now = new Date();
  for (let i = 363; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = toISODate(d);
    result.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
  }
  return result;
}

// ─── Platform Health & Alerts ─────────────────────────────────────────────────

export async function getPlatformAlerts(): Promise<PlatformAlert[]> {
  const alerts: PlatformAlert[] = [];

  const thisWeekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);

  const [
    { count: sessionsThisWeek },
    { count: sessionsLastWeek },
    { count: nutritionThisWeek },
    { count: nutritionLastWeek },
    { count: usersThisWeek },
    { count: usersLastWeek },
  ] = await Promise.all([
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).gte('workout_date', thisWeekStart),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).gte('workout_date', lastWeekStart).lt('workout_date', thisWeekStart),
    supabase.from('nutrition_entries').select('*', { count: 'exact', head: true }).gte('entry_date', thisWeekStart),
    supabase.from('nutrition_entries').select('*', { count: 'exact', head: true }).gte('entry_date', lastWeekStart).lt('entry_date', thisWeekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thisWeekStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', lastWeekStart).lt('created_at', thisWeekStart),
  ]);

  const pct = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

  const sessDrop = pct(sessionsThisWeek ?? 0, sessionsLastWeek ?? 1);
  const nutritionDrop = pct(nutritionThisWeek ?? 0, nutritionLastWeek ?? 1);
  const userDrop = pct(usersThisWeek ?? 0, usersLastWeek ?? 1);

  if (sessDrop <= -30) {
    alerts.push({
      id: 'sessions-drop',
      severity: sessDrop <= -50 ? 'critical' : 'warning',
      title: 'Caída en entrenamientos',
      message: `Los entrenamientos esta semana bajaron un ${Math.abs(sessDrop)}% respecto a la semana anterior.`,
    });
  }
  if (nutritionDrop <= -30) {
    alerts.push({
      id: 'nutrition-drop',
      severity: nutritionDrop <= -50 ? 'critical' : 'warning',
      title: 'Caída en registros nutricionales',
      message: `Los registros de nutrición bajaron un ${Math.abs(nutritionDrop)}% esta semana.`,
    });
  }
  if (userDrop <= -50) {
    alerts.push({
      id: 'users-drop',
      severity: 'warning',
      title: 'Caída en nuevos registros',
      message: `Los nuevos usuarios bajaron un ${Math.abs(userDrop)}% respecto a la semana anterior.`,
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-ok',
      severity: 'info',
      title: 'Todo en orden',
      message: 'No se detectaron caídas significativas en la actividad de la plataforma.',
    });
  }

  return alerts;
}

// ─── Weight progress (weekly) ─────────────────────────────────────────────────

export async function getWeightProgressChart(): Promise<WeightProgressPoint[]> {
  const now = new Date();
  const results: WeightProgressPoint[] = [];

  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const { data } = await supabase
      .from('workout_sessions')
      .select('total_weight_kg')
      .gte('workout_date', toISODate(start))
      .lte('workout_date', toISODate(end))
      .not('total_weight_kg', 'is', null);

    const total = (data ?? []).reduce(
      (s: number, d: { total_weight_kg: number | null }) => s + (d.total_weight_kg ?? 0),
      0
    );
    results.push({ week: `S${8 - i}`, totalKg: Math.round(total) });
  }
  return results;
}

// ─── Top users by weight lifted ───────────────────────────────────────────────

export async function getTopUsersByWeight(limit = 8): Promise<TopUser[]> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('user_id, status, total_weight_kg');

  if (!sessions) return [];

  const map = new Map<string, { sessions: number; completed: number; totalWeightKg: number }>();
  sessions.forEach((s: { user_id: string; status: string; total_weight_kg: number | null }) => {
    const e = map.get(s.user_id) ?? { sessions: 0, completed: 0, totalWeightKg: 0 };
    e.sessions += 1;
    if (s.status === 'completed') e.completed += 1;
    e.totalWeightKg += s.total_weight_kg ?? 0;
    map.set(s.user_id, e);
  });

  const topIds = [...map.entries()]
    .sort((a, b) => b[1].totalWeightKg - a[1].totalWeightKg)
    .slice(0, limit)
    .map(([id]) => id);

  if (!topIds.length) return [];

  const { data: users } = await supabase
    .from('users')
    .select('user_id, name, last_name, email, avatar_url')
    .in('user_id', topIds);

  return (users ?? []).map((u) => {
    const stats = map.get(u.user_id)!;
    return {
      user_id: u.user_id,
      name: u.name,
      last_name: u.last_name,
      email: u.email,
      avatar_url: u.avatar_url,
      sessions: stats.sessions,
      completed: stats.completed,
      totalWeightKg: Math.round(stats.totalWeightKg),
    };
  }).sort((a, b) => b.totalWeightKg - a.totalWeightKg);
}


