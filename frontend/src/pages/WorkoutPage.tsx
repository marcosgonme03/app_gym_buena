import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TopNav } from '@/components/layout/TopNav';
import { getWeekStart, getWeekEnd } from '@/features/member/workoutPlan/weekHelpers';
import { useDashboardData } from '@/features/member/dashboard/useDashboardData';
import { useTodayWorkout } from '@/features/member/dashboard/hooks/useTodayWorkout';
import { useWeeklyProgress } from '@/features/member/dashboard/hooks/useWeeklyProgress';
import { supabase } from '@/lib/supabase/client';

// ─── Utils ────────────────────────────────────────────────────────────────────
const toISO = (d: Date) => d.toISOString().split('T')[0];
const todayISO = toISO(new Date());

function formatDisplayDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function deriveCategoryFromName(name: string): string {
  const n = name.toLowerCase();
  if (
    n.includes('fuerza') || n.includes('pecho') || n.includes('espalda') ||
    n.includes('pierna') || n.includes('bicep') || n.includes('bícep') ||
    n.includes('tricep') || n.includes('hombro') || n.includes('brazos')
  ) return 'fuerza';
  if (n.includes('hipert')) return 'hipertrofia';
  if (
    n.includes('cardio') || n.includes('correr') || n.includes('aerob') ||
    n.includes('grasa')  || n.includes('quemar')
  ) return 'cardio';
  return 'general';
}

function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const lastDate    = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon-based
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(d);
  return days;
}

const MONTH_NAMES_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkoutHistoryItem {
  id: string;
  workout_date: string;
  session_name: string;
  exercise_count: number;
  total_weight_kg: number;
  actual_duration_min: number | null;
  category: string;
}

interface DaySession {
  id: string;
  session_name: string;
  status: string;
  actual_duration_min: number | null;
  total_weight_kg: number;
  exercise_count: number;
  category: string;
  muscle_group: string | null;
}

interface WorkoutStats {
  totalSessions: number;
  totalWeightKg: number;
  thisMonthSessions: number;
}

// ─── Static sidebar data ──────────────────────────────────────────────────────
const ROUTINES = [
  { id: 'fuerza',   label: 'Fuerza',          category: 'fuerza'      },
  { id: 'hipert',   label: 'Hipertrofia',      category: 'hipertrofia' },
  { id: 'perdida',  label: 'Pérdida de Grasa', category: 'cardio'      },
  { id: 'fullbody', label: 'Full Body',         category: 'general'     },
];

const CATEGORIES = [
  { id: 'fuerza',      label: 'Fuerza',      color: 'blue'   },
  { id: 'hipertrofia', label: 'Hipertrofia', color: 'purple' },
  { id: 'cardio',      label: 'Cardio',      color: 'red'    },
  { id: 'general',     label: 'General',     color: 'teal'   },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const WorkoutPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─ Week / today workout hook ──────────────────────────────────────────────
  const [weekStart] = useState(() => getWeekStart());
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const { planData, weeklyStats } = useDashboardData(weekStart, weekEnd);
  const {
    data: todayWorkout,
    loading: todayLoading,
    startWorkout,
    refresh: refreshToday,
  } = useTodayWorkout(planData);
  const { refresh: refreshWeeklyProgress } = useWeeklyProgress(weekStart, weeklyStats);

  // ─ Calendar state ─────────────────────────────────────────────────────────
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // ─ Selected date ──────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || todayISO);

  // ─ Workout for selected date ──────────────────────────────────────────────
  const [daySession,        setDaySession]        = useState<DaySession | null>(null);
  const [daySessionLoading, setDaySessionLoading] = useState(false);

  // ─ Calendar completed days ────────────────────────────────────────────────
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());

  // ─ History ────────────────────────────────────────────────────────────────
  const [history,        setHistory]        = useState<WorkoutHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage,    setHistoryPage]    = useState(1);

  // ─ Sidebar filters ────────────────────────────────────────────────────────
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [activeCategory,  setActiveCategory]  = useState<string | null>(null);

  // ─ Stats ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<WorkoutStats>({
    totalSessions: 0, totalWeightKg: 0, thisMonthSessions: 0,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECT: Fetch completed days for the displayed calendar month
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const mm      = String(calMonth + 1).padStart(2, '0');
      const lastDay   = new Date(calYear, calMonth + 1, 0).getDate();
      const start     = `${calYear}-${mm}-01`;
      const end       = `${calYear}-${mm}-${String(lastDay).padStart(2, '0')}`;
      const { data } = await supabase
        .from('workout_sessions')
        .select('workout_date')
        .eq('user_id', user.id)
        .eq('status',  'completed')
        .gte('workout_date', start)
        .lte('workout_date', end);
      if (data) {
        setCompletedDays(new Set((data as any[]).map(r => r.workout_date as string)));
      }
    })();
  }, [calYear, calMonth]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECT: Fetch session for selected date
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setDaySession(null);
      setDaySessionLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Try with new columns first; fall back if migration hasn't run yet
        const fullSelect = `id, status, actual_duration_min, total_weight_kg,
            session_name, category, muscle_group, plan_session_id,
            weekly_workout_sessions:plan_session_id(name, weekly_workout_exercises(id))`;
        const baseSelect = `id, status, actual_duration_min,
            plan_session_id,
            weekly_workout_sessions:plan_session_id(name, weekly_workout_exercises(id))`;

        let result: any = await supabase
          .from('workout_sessions')
          .select(fullSelect)
          .eq('user_id',      user.id)
          .eq('workout_date', selectedDate)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // If new columns don't exist yet, retry with base columns only
        if (result.error && result.status === 400) {
          result = await supabase
            .from('workout_sessions')
            .select(baseSelect)
            .eq('user_id',      user.id)
            .eq('workout_date', selectedDate)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        }

        const { data, error } = result;
        if (error) throw error;
        if (data) {
          const ref  = (data as any).weekly_workout_sessions;
          const name = (data as any).session_name || ref?.name || 'Entrenamiento libre';
          setDaySession({
            id:                 data.id,
            session_name:       name,
            status:             (data as any).status,
            actual_duration_min:(data as any).actual_duration_min ?? null,
            total_weight_kg:    (data as any).total_weight_kg ?? 0,
            exercise_count:     ref?.weekly_workout_exercises?.length ?? 0,
            category:           (data as any).category || deriveCategoryFromName(name),
            muscle_group:       (data as any).muscle_group ?? null,
          });
        }
      } catch (err) {
        console.error('[WorkoutPage] daySession:', err);
      } finally {
        setDaySessionLoading(false);
      }
    })();
  }, [selectedDate]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECT: Fetch history (top 50, filtered client-side)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setHistoryLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Try with new columns; fall back if migration hasn't run yet
        const histFull = `id, workout_date, actual_duration_min, total_weight_kg,
            session_name, category, plan_session_id,
            weekly_workout_sessions:plan_session_id(name, weekly_workout_exercises(id))`;
        const histBase = `id, workout_date, actual_duration_min, plan_session_id,
            weekly_workout_sessions:plan_session_id(name, weekly_workout_exercises(id))`;

        let histResult: any = await supabase
          .from('workout_sessions')
          .select(histFull)
          .eq('user_id', user.id)
          .eq('status',  'completed')
          .order('workout_date', { ascending: false })
          .limit(50);

        if (histResult.error && histResult.status === 400) {
          histResult = await supabase
            .from('workout_sessions')
            .select(histBase)
            .eq('user_id', user.id)
            .eq('status',  'completed')
            .order('workout_date', { ascending: false })
            .limit(50);
        }

        const { data, error } = histResult;
        if (error) throw error;
        const mapped: WorkoutHistoryItem[] = ((data || []) as any[]).map(row => {
          const ref  = row.weekly_workout_sessions;
          const name = row.session_name || ref?.name || 'Entrenamiento libre';
          return {
            id:                  row.id,
            workout_date:        row.workout_date,
            session_name:        name,
            exercise_count:      ref?.weekly_workout_exercises?.length ?? 0,
            total_weight_kg:     row.total_weight_kg ?? 0,
            actual_duration_min: row.actual_duration_min ?? null,
            category:            row.category || deriveCategoryFromName(name),
          };
        });
        setHistory(mapped);
      } catch (err) {
        console.error('[WorkoutPage] history:', err);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECT: Fetch stats
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Try RPC first (requires the SQL function to exist)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_workout_stats', { p_user_id: user.id });
      if (!rpcErr && rpcData && rpcData[0]) {
        const row = rpcData[0];
        setStats({
          totalSessions:     Number(row.total_sessions)      || 0,
          totalWeightKg:     Math.round(Number(row.total_weight_kg)  || 0),
          thisMonthSessions: Number(row.this_month_sessions) || 0,
        });
      } else {
        // Fallback manual — only use columns that definitely exist
        const { count } = await supabase
          .from('workout_sessions').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('status', 'completed');
        // Try to get total_weight_kg; silently ignore if column doesn't exist yet
        let totalW = 0;
        const { data: wData, error: wErr } = await supabase
          .from('workout_sessions').select('total_weight_kg')
          .eq('user_id', user.id).eq('status', 'completed');
        if (!wErr) {
          totalW = ((wData || []) as any[]).reduce((a, r) => a + (r.total_weight_kg ?? 0), 0);
        }
        setStats({ totalSessions: count ?? 0, totalWeightKg: Math.round(totalW), thisMonthSessions: 0 });
      }
    })();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const goToDate = useCallback((iso: string) => {
    setSelectedDate(iso);
    setSearchParams({ date: iso }, { replace: true });
  }, [setSearchParams]);

  const handleDayClick = useCallback((day: number) => {
    const mm  = String(calMonth + 1).padStart(2, '0');
    const dd  = String(day).padStart(2, '0');
    goToDate(`${calYear}-${mm}-${dd}`);
  }, [calYear, calMonth, goToDate]);

  const prevMonth = useCallback(() => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }, [calMonth]);

  const goToToday = useCallback(() => {
    goToDate(todayISO);
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToDate]);

  const handleRoutineClick = useCallback((routineId: string) => {
    const routine = ROUTINES.find(r => r.id === routineId);
    if (activeRoutineId === routineId) {
      setActiveRoutineId(null); setActiveCategory(null);
    } else {
      setActiveRoutineId(routineId);
      setActiveCategory(routine?.category ?? null);
    }
    setHistoryPage(1);
  }, [activeRoutineId]);

  const handleCategoryClick = useCallback((cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null); setActiveRoutineId(null);
    } else {
      setActiveCategory(cat);
      setActiveRoutineId(ROUTINES.find(r => r.category === cat)?.id ?? null);
    }
    setHistoryPage(1);
  }, [activeCategory]);

  const handleStartWorkout = useCallback(async () => {
    if (!todayWorkout) return navigate('/app/workout/crear');
    if (todayWorkout.status === 'not_started') {
      await startWorkout();
      await Promise.all([refreshToday(), refreshWeeklyProgress()]);
      navigate('/app/workout/today');
    } else if (todayWorkout.status === 'in_progress') {
      navigate('/app/workout/today');
    } else if (todayWorkout.status === 'completed' && todayWorkout.session?.id) {
      navigate(`/app/workout/summary/${todayWorkout.session.id}`);
    } else {
      navigate('/app/workout-plan');
    }
  }, [todayWorkout, startWorkout, refreshToday, refreshWeeklyProgress, navigate]);

  const handleRepeatWorkout = useCallback(async (item: WorkoutHistoryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('workout_sessions').insert({
        user_id:               user.id,
        workout_date:          todayISO,
        status:                'not_started',
        session_name:          item.session_name,
        category:              item.category,
        estimated_duration_min: item.actual_duration_min,
      });
    } catch (err) {
      console.error('[WorkoutPage] repeatWorkout:', err);
    } finally {
      navigate('/app/workout/today');
    }
  }, [navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────────────────
  const filteredHistory  = useMemo(() =>
    activeCategory ? history.filter(h => h.category === activeCategory) : history,
    [history, activeCategory],
  );
  const displayedHistory = useMemo(
    () => filteredHistory.slice(0, historyPage * 8),
    [filteredHistory, historyPage],
  );
  const hasMoreHistory   = displayedHistory.length < filteredHistory.length;

  const calDays   = buildCalendar(calYear, calMonth);
  const todayDate = now.getDate();
  const isToday   = selectedDate === todayISO;

  const levelLabel = profile?.level
    ? ({ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' } as Record<string,string>)[profile.level] ?? 'Intermedio'
    : 'Intermedio';

  const CTA_MAP: Record<string, string> = {
    not_started: '▶  INICIAR RUTINA',
    in_progress: '⚡ CONTINUAR SESIÓN',
    completed:   '✓  VER RESUMEN',
  };
  const todayStatus = todayWorkout?.status ?? 'not_started';
  const ctaLabel    = CTA_MAP[todayStatus] ?? '▶  INICIAR RUTINA';

  // Category color classes
  const catColorMap: Record<string, { active: string; hover: string }> = {
    blue:   { active: 'border-blue-500/50 bg-blue-500/10 text-blue-300',     hover: 'border-dark-800 text-dark-500 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5'   },
    purple: { active: 'border-purple-500/50 bg-purple-500/10 text-purple-300', hover: 'border-dark-800 text-dark-500 hover:border-purple-500/30 hover:text-purple-400 hover:bg-purple-500/5' },
    red:    { active: 'border-red-500/50 bg-red-500/10 text-red-300',         hover: 'border-dark-800 text-dark-500 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5'     },
    teal:   { active: 'border-teal-500/50 bg-teal-500/10 text-teal-300',      hover: 'border-dark-800 text-dark-500 hover:border-teal-500/30 hover:text-teal-400 hover:bg-teal-500/5'  },
  };

  const histCatBadge: Record<string, string> = {
    fuerza:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hipertrofia: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cardio:      'bg-red-500/10 text-red-400 border-red-500/20',
    general:     'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };

  if (!profile) return null;

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">

        {/* ═══════════════════════════ LEFT SIDEBAR ═══════════════════════════ */}
        <aside className="w-56 flex-shrink-0 border-r border-dark-800/50 px-4 py-7 hidden lg:flex flex-col gap-7">

          {/* Mis Rutinas */}
          <div>
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-3 px-2">Tus Rutinas</p>
            <div className="space-y-0.5">
              {ROUTINES.map(r => {
                const isActive = activeRoutineId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRoutineClick(r.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left border
                      ${isActive
                        ? 'bg-primary-500/15 text-primary-300 border-primary-500/20'
                        : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200 border-transparent'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                      ${isActive ? 'bg-primary-400' : 'bg-dark-700'}`}
                    />
                    <span className="flex-1 truncate">{r.label}</span>
                    {isActive && (
                      <span className="text-[9px] text-primary-500 font-bold bg-primary-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                        activo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/app/workout/crear')}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-dark-500 hover:text-primary-400 hover:bg-primary-500/5 border border-dashed border-dark-800 hover:border-primary-500/30 transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Nueva Rutina
            </button>
          </div>

          {/* Categorías */}
          <div>
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-3 px-2">Categorías</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                const cls      = isActive ? catColorMap[cat.color].active : catColorMap[cat.color].hover;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${cls}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                      {cat.id === 'fuerza'      && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5h16.5M3.75 13.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 013.75 3.75h16.5A2.25 2.25 0 0122.5 6v5.25a2.25 2.25 0 01-2.25 2.25M3.75 13.5v5.25a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V13.5" />}
                      {cat.id === 'hipertrofia' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />}
                      {cat.id === 'cardio'      && <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />}
                      {cat.id === 'general'     && <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />}
                    </svg>
                    <span className="text-[10px] font-semibold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-auto pt-5 border-t border-dark-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-dark-600 uppercase tracking-wider font-semibold">Este mes</span>
              <span className="text-sm font-black text-primary-400 tabular-nums">{stats.thisMonthSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-dark-600 uppercase tracking-wider font-semibold">Total</span>
              <span className="text-sm font-black text-dark-200 tabular-nums">{stats.totalSessions}</span>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════ MAIN CONTENT ═══════════════════════════ */}
        <main className="flex-1 px-6 lg:px-8 py-7 min-w-0 overflow-hidden">

          {/* Page header */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-3xl lg:text-4xl font-black text-dark-50 tracking-tight">Entrenamientos</h1>
              {activeCategory && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20 uppercase tracking-wider">
                  {activeCategory}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <span>
                {activeRoutineId
                  ? `Rutina de ${ROUTINES.find(r => r.id === activeRoutineId)?.label ?? ''}`
                  : 'Todos los entrenamientos'}
              </span>
              <span className="text-dark-700">·</span>
              <span className="text-dark-600">Nivel {levelLabel}</span>
            </div>
          </div>

          {/* ── SELECTED-DATE CARD ──────────────────────────────────────────── */}
          <section className="mb-7">
            {(isToday && todayLoading) || daySessionLoading ? (

              /* Loading skeleton */
              <div className="bg-dark-900 border border-dark-800 rounded-2xl animate-pulse overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-72 h-56 bg-dark-800 flex-shrink-0" />
                  <div className="flex-1 p-8 space-y-4">
                    <div className="h-3 w-16 bg-dark-800 rounded-full" />
                    <div className="h-6 w-56 bg-dark-800 rounded-lg" />
                    <div className="flex gap-2">
                      <div className="h-6 w-24 bg-dark-800 rounded-full" />
                      <div className="h-6 w-20 bg-dark-800 rounded-full" />
                    </div>
                    <div className="h-12 w-48 bg-dark-800 rounded-xl mt-3" />
                  </div>
                </div>
              </div>

            ) : isToday ? (

              /* TODAY card */
              <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-dark-700/80 shadow-xl shadow-dark-950/50">
                <div className="flex flex-col md:flex-row">

                  {/* Image */}
                  <div className="relative md:w-72 lg:w-80 flex-shrink-0 h-60 md:h-auto" style={{ minHeight: 220 }}>
                    <img
                      src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&q=80"
                      alt="Entrenamiento"
                      className="w-full h-full object-cover object-top"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-900/20 to-dark-900 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 to-transparent md:hidden" />

                    {/* HOY badge */}
                    <div className="absolute top-4 left-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        HOY
                      </span>
                    </div>

                    {/* In-progress badge */}
                    {todayWorkout?.status === 'in_progress' && (
                      <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-full bg-amber-500 text-white shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        En progreso
                      </span>
                    )}
                    {todayWorkout?.status === 'completed' && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                        ✓ Completado
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <p className="text-[11px] text-primary-400 uppercase tracking-widest font-bold mb-2">
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>

                    {todayWorkout?.plannedWorkout ? (
                      <>
                        <h2 className="text-2xl font-black text-dark-50 mb-1 leading-tight">
                          {todayWorkout.plannedWorkout.name?.includes(' - ')
                            ? todayWorkout.plannedWorkout.name.split(' - ')[0]
                            : todayWorkout.plannedWorkout.name || 'Entrenamiento de hoy'}
                        </h2>
                        {todayWorkout.plannedWorkout.name?.includes(' - ') && (
                          <p className="text-sm text-dark-400 mb-4">
                            {todayWorkout.plannedWorkout.name.split(' - ')[1]}
                          </p>
                        )}

                        {/* Meta badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {levelLabel}
                          </span>
                          {(todayWorkout.estimatedDurationMin ?? 0) > 0 && (
                            <span className="flex items-center gap-1.5 text-xs bg-dark-800 text-dark-300 border border-dark-700 px-3 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {todayWorkout.estimatedDurationMin} min
                            </span>
                          )}
                          {(todayWorkout.exerciseCount ?? 0) > 0 && (
                            <span className="text-xs bg-dark-800 text-dark-300 border border-dark-700 px-3 py-1 rounded-full">
                              {todayWorkout.exerciseCount} ejercicios
                            </span>
                          )}
                        </div>

                        <button
                          onClick={handleStartWorkout}
                          className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-black rounded-xl transition-all duration-200 uppercase tracking-widest shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {ctaLabel}
                        </button>
                      </>
                    ) : daySession ? (
                      /* Free session created manually for today */
                      <div>
                        <h2 className="text-xl font-black text-dark-50 mb-1 leading-tight">
                          {daySession.session_name}
                        </h2>
                        {daySession.muscle_group && (
                          <p className="text-sm text-dark-400 mb-4">{daySession.muscle_group}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {daySession.actual_duration_min ? (
                            <span className="flex items-center gap-1.5 text-xs bg-dark-800 text-dark-300 border border-dark-700 px-3 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {daySession.actual_duration_min} min
                            </span>
                          ) : null}
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                            (histCatBadge as Record<string,string>)[daySession.category] ?? histCatBadge.general
                          }`}>
                            {daySession.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleStartWorkout}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-black rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 uppercase tracking-wider"
                          >
                            {daySession.status === 'completed'
                              ? '✓  Ver Resumen'
                              : daySession.status === 'in_progress'
                                ? '⚡ Continuar Sesión'
                                : '▶  Iniciar Entrenamiento'}
                          </button>
                          <button
                            onClick={() => navigate('/app/workout')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm font-semibold rounded-xl transition-all border border-dark-700 hover:border-dark-600"
                          >
                            Ver historial
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* No workout today — empty state */
                      <div>
                        <h2 className="text-xl font-black text-dark-200 mb-2">Sin entrenamiento asignado</h2>
                        <p className="text-sm text-dark-500 mb-6 leading-relaxed max-w-sm">
                          No tienes ninguna sesión planificada para hoy. Crea un entrenamiento libre o configura tu plan semanal.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => navigate('/app/workout/crear')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 uppercase tracking-wider"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Crear plan para hoy
                          </button>
                          <button
                            onClick={() => navigate('/app/workout-plan')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-200 text-sm font-semibold rounded-xl transition-all duration-200 border border-dark-700 hover:border-dark-600"
                          >
                            Configurar plan semanal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            ) : daySession ? (

              /* PAST / FUTURE DATE WITH SESSION */
              <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl shadow-dark-950/40 transition-all duration-200 hover:border-dark-700/80">
                <div className="flex flex-col md:flex-row">
                  <div className="relative md:w-72 flex-shrink-0 h-52 md:h-auto" style={{ minHeight: 180 }}>
                    <img
                      src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80"
                      alt="Sesión"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-900 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 to-transparent md:hidden" />
                    {daySession.status === 'completed' ? (
                      <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                        ✓ Completado
                      </span>
                    ) : daySession.status === 'in_progress' ? (
                      <span className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-full bg-amber-500 text-white shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        En progreso
                      </span>
                    ) : (
                      <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full bg-primary-500 text-white shadow-lg">
                        Programado
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <p className="text-[11px] text-dark-500 uppercase tracking-widest font-bold mb-2 capitalize">
                      {formatDisplayDate(selectedDate)}
                    </p>
                    <h2 className="text-2xl font-black text-dark-50 mb-4">{daySession.session_name}</h2>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {daySession.muscle_group && (
                        <span className="text-xs bg-primary-500/15 text-primary-300 border border-primary-500/20 px-3 py-1 rounded-full font-semibold">
                          {daySession.muscle_group}
                        </span>
                      )}
                      {daySession.actual_duration_min && (
                        <span className="flex items-center gap-1.5 text-xs bg-dark-800 text-dark-300 border border-dark-700 px-3 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {daySession.actual_duration_min} min
                        </span>
                      )}
                      {daySession.exercise_count > 0 && (
                        <span className="text-xs bg-dark-800 text-dark-300 border border-dark-700 px-3 py-1 rounded-full">
                          {daySession.exercise_count} ejercicios
                        </span>
                      )}
                      {daySession.total_weight_kg > 0 && (
                        <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full font-semibold">
                          {daySession.total_weight_kg.toLocaleString('es-ES')} kg
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {daySession.status === 'completed' ? (
                        <button
                          onClick={() => navigate(`/app/workout/summary/${daySession.id}`)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 uppercase tracking-wider"
                        >
                          Ver detalle completo
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/app/workout/today')}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 uppercase tracking-wider"
                        >
                          {daySession.status === 'in_progress' ? '⚡ Continuar' : '▶  Iniciar'}
                        </button>
                      )}
                      {daySession.status === 'completed' && (
                        <button
                          onClick={() => handleRepeatWorkout({
                            id: daySession.id, workout_date: selectedDate,
                            session_name: daySession.session_name, exercise_count: daySession.exercise_count,
                            total_weight_kg: daySession.total_weight_kg, actual_duration_min: daySession.actual_duration_min,
                            category: daySession.category,
                          })}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-200 text-sm font-semibold rounded-xl transition-all duration-200 border border-dark-700 hover:border-dark-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Repetir hoy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            ) : (

              /* EMPTY STATE for this date */
              <div className="bg-dark-900 border border-dark-800/60 border-dashed rounded-2xl p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-4 shadow-inner">
                  <svg className="w-8 h-8 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                  </svg>
                </div>
                <p className="text-dark-200 font-bold mb-1 text-base capitalize">
                  {isToday
                    ? 'Sin entrenamiento hoy'
                    : `Sin entrenamiento · ${formatDisplayDate(selectedDate)}`}
                </p>
                <p className="text-dark-600 text-sm mb-6 max-w-xs leading-relaxed">
                  {selectedDate > todayISO
                    ? 'Planifica un entrenamiento para esta fecha futura.'
                    : isToday
                      ? 'Empieza ahora o crea un plan para hoy.'
                      : 'No hay registro de entrenamiento para este día.'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => navigate(`/app/workout/crear?date=${selectedDate}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {isToday ? 'Crear entrenamiento' : 'Crear para esta fecha'}
                  </button>
                  {!isToday && (
                    <button
                      onClick={goToToday}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm font-semibold rounded-xl transition-all border border-dark-700 hover:border-dark-600"
                    >
                      Volver a hoy
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── HISTORY TABLE ──────────────────────────────────────────────── */}
          <section className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-dark-50">Historial de Entrenamientos</h2>
                {filteredHistory.length > 0 && (
                  <span className="text-xs font-bold text-dark-600 bg-dark-800 px-2 py-0.5 rounded-full tabular-nums">
                    {filteredHistory.length}
                  </span>
                )}
                {activeCategory && (
                  <button
                    onClick={() => { setActiveCategory(null); setActiveRoutineId(null); }}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full hover:bg-primary-500/20 transition-colors capitalize"
                  >
                    {activeCategory}
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => navigate('/app/progress')}
                className="text-xs text-dark-600 hover:text-primary-400 transition-colors font-semibold shrink-0 ml-3"
              >
                Ver todo →
              </button>
            </div>

            {historyLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse py-2">
                    <div className="h-10 w-10 bg-dark-800 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-44 bg-dark-800 rounded" />
                      <div className="h-3 w-28 bg-dark-800 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-dark-800 rounded-full hidden sm:block" />
                    <div className="h-4 w-20 bg-dark-800 rounded hidden md:block" />
                    <div className="h-8 w-28 bg-dark-800 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : displayedHistory.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-dark-300 font-bold mb-1">
                  {activeCategory
                    ? `Sin entrenamientos de categoría "${activeCategory}"`
                    : 'Sin entrenamientos completados'}
                </p>
                <p className="text-dark-600 text-sm mb-5 max-w-xs mx-auto leading-relaxed">
                  {activeCategory
                    ? 'Prueba otro filtro o completa un entrenamiento de esta categoría.'
                    : '¡Completa tu primer entrenamiento para verlo aquí!'}
                </p>
                {!activeCategory && (
                  <button
                    onClick={() => navigate('/app/workout/today')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-primary-500/20"
                  >
                    Empezar ahora
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="divide-y divide-dark-800/60">
                  {displayedHistory.map(item => {
                    const d        = new Date(item.workout_date + 'T12:00:00');
                    const dayNum   = d.getDate();
                    const monthStr = MONTH_NAMES_ES[d.getMonth()].slice(0, 3);
                    const yearNum  = d.getFullYear();
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-dark-800/25 transition-colors duration-150 group"
                      >
                        {/* Date block */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex flex-col items-center justify-center group-hover:border-dark-600 transition-colors">
                          <span className="text-sm font-black text-dark-100 leading-none tabular-nums">{dayNum}</span>
                          <span className="text-[9px] text-dark-600 uppercase font-semibold leading-none mt-0.5">{monthStr}</span>
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark-100 truncate group-hover:text-dark-50 transition-colors">
                            {item.session_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.exercise_count > 0 && (
                              <span className="text-xs text-dark-600">{item.exercise_count} ejercicios</span>
                            )}
                            {item.actual_duration_min && (
                              <>
                                <span className="text-dark-800 text-xs">·</span>
                                <span className="text-xs text-dark-600">{item.actual_duration_min} min</span>
                              </>
                            )}
                            {yearNum !== now.getFullYear() && (
                              <>
                                <span className="text-dark-800 text-xs">·</span>
                                <span className="text-xs text-dark-700">{yearNum}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Category badge */}
                        <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0
                          ${histCatBadge[item.category] ?? histCatBadge.general}`}
                        >
                          {item.category}
                        </span>

                        {/* Weight */}
                        {item.total_weight_kg > 0 && (
                          <div className="hidden md:flex items-center gap-1 shrink-0">
                            <svg className="w-3 h-3 text-orange-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            <span className="text-sm font-bold text-dark-300 tabular-nums">
                              {item.total_weight_kg.toLocaleString('es-ES')} kg
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => navigate(`/app/workout/summary/${item.id}`)}
                            className="px-3 py-1.5 text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 hover:border-primary-500/40 transition-all duration-150"
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => handleRepeatWorkout(item)}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-dark-800 text-dark-400 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-dark-200 transition-all duration-150"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Repetir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load more */}
                {hasMoreHistory && (
                  <div className="px-6 py-4 border-t border-dark-800">
                    <button
                      onClick={() => setHistoryPage(p => p + 1)}
                      className="w-full py-2.5 text-xs font-bold text-dark-500 hover:text-dark-300 uppercase tracking-widest transition-colors border border-dark-800 rounded-xl hover:border-dark-700 hover:bg-dark-800/30"
                    >
                      Cargar más ({filteredHistory.length - displayedHistory.length} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* ═══════════════════════════ RIGHT SIDEBAR ══════════════════════════ */}
        <aside className="w-64 flex-shrink-0 border-l border-dark-800/50 px-4 py-7 hidden xl:flex flex-col gap-5">

          {/* ── Calendar ── */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                aria-label="Mes anterior"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-800 text-dark-500 hover:text-dark-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="text-xs font-bold text-dark-200 uppercase tracking-widest">
                {MONTH_NAMES_ES[calMonth].slice(0, 3)} {calYear}
              </p>
              <button
                onClick={nextMonth}
                aria-label="Mes siguiente"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-800 text-dark-500 hover:text-dark-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['L','M','X','J','V','S','D'].map(d => (
                <div key={d} className="text-center text-[9px] text-dark-600 font-bold py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {calDays.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const mm   = String(calMonth + 1).padStart(2, '0');
                const dd   = String(day).padStart(2, '0');
                const iso  = `${calYear}-${mm}-${dd}`;
                const isDone = completedDays.has(iso);
                const isSel  = iso === selectedDate;
                const isTodayCal = calYear === now.getFullYear() && calMonth === now.getMonth() && day === todayDate;
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    title={isDone ? 'Entrenamiento completado' : isTodayCal ? 'Hoy' : ''}
                    className={`relative flex items-center justify-center w-7 h-7 mx-auto rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer
                      ${isSel    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110' : ''}
                      ${isDone && !isSel ? 'bg-emerald-500/20 text-emerald-300' : ''}
                      ${isTodayCal && !isSel ? 'ring-1 ring-primary-500/60 text-primary-300' : ''}
                      ${!isSel && !isDone && !isTodayCal ? 'text-dark-500 hover:bg-dark-800 hover:text-dark-200' : ''}
                    `}
                  >
                    {day}
                    {isDone && !isSel && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToToday}
              className="mt-4 w-full py-2 text-[10px] font-bold text-dark-500 hover:text-primary-400 uppercase tracking-widest transition-colors border border-dark-800 rounded-xl hover:border-primary-500/30"
            >
              Ir a hoy
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-dark-100 mb-4">Estadísticas</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Total sesiones</span>
                </div>
                <p className="text-4xl font-black text-dark-50 leading-none pl-1 tabular-nums">{stats.totalSessions}</p>
              </div>

              <div className="border-t border-dark-800 pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Peso levantado</span>
                </div>
                <div className="flex items-baseline gap-1.5 pl-1">
                  <span className="text-3xl font-black text-dark-50 leading-none tabular-nums">
                    {stats.totalWeightKg > 0 ? stats.totalWeightKg.toLocaleString('es-ES') : '—'}
                  </span>
                  {stats.totalWeightKg > 0 && (
                    <span className="text-sm text-dark-500 font-semibold">kg</span>
                  )}
                </div>
              </div>

              {stats.thisMonthSessions > 0 && (
                <div className="border-t border-dark-800 pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Este mes</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-400 leading-none pl-1 tabular-nums">{stats.thisMonthSessions}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/app/progress')}
              className="mt-5 w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider border border-dark-700 hover:border-dark-600"
            >
              Ver estadísticas completas
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default WorkoutPage;
