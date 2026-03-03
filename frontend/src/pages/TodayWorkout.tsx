import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { getWeekStart } from '@/features/member/workoutPlan/weekHelpers';
import { getWeeklyPlanFull } from '@/features/member/workoutPlan/api';
import type { SessionWithExercises } from '@/features/member/workoutPlan/types';
import {
  completeWorkoutSession,
  getWorkoutSessionByDate,
  upsertWorkoutSession,
  type WorkoutSessionRecord,
} from '@/services/supabase/workoutSessions';

// ─── Utils ────────────────────────────────────────────────────────────────────
const toISO = (d: Date) => d.toISOString().split('T')[0];

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function deriveCategoryColor(cat?: string | null) {
  switch (cat) {
    case 'fuerza':      return { bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/20'   };
    case 'hipertrofia': return { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/20' };
    case 'cardio':      return { bg: 'bg-red-500/10',    text: 'text-red-300',    border: 'border-red-500/20'    };
    default:            return { bg: 'bg-teal-500/10',   text: 'text-teal-300',   border: 'border-teal-500/20'   };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export const TodayWorkout: React.FC = () => {
  const navigate  = useNavigate();
  const today     = useMemo(() => toISO(new Date()), []);

  // ─ Data state ───────────────────────────────────────────────────────────────
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [session,        setSession]        = useState<WorkoutSessionRecord | null>(null);
  const [plannedWorkout, setPlannedWorkout] = useState<SessionWithExercises | null>(null);
  const [notes,          setNotes]          = useState('');
  const [saving,         setSaving]         = useState(false);

  // ─ Exercise checklist ───────────────────────────────────────────────────────
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // ─ Live timer ───────────────────────────────────────────────────────────────
  const [elapsed, setElapsed]   = useState(0);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((startedAt: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const base = startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0;
    setElapsed(base);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ─ Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const weekStart = getWeekStart(today);
      const [plan, todaySession] = await Promise.all([
        getWeeklyPlanFull(weekStart),
        getWorkoutSessionByDate(today),
      ]);

      const todaysPlanned = plan.sessions.find(s => s.session_date === today) || null;
      setPlannedWorkout(todaysPlanned);

      let activeSession = todaySession;
      if (activeSession) {
        setNotes(activeSession.notes || '');
        // If it's already in_progress from a previous visit, update started_at would have set
        if (activeSession.status === 'not_started') {
          // Auto-start when landing here
          activeSession = await upsertWorkoutSession({
            workoutDate: today,
            planSessionId: activeSession.plan_session_id ?? todaysPlanned?.id ?? null,
            status: 'in_progress',
            estimatedDurationMin: activeSession.estimated_duration_min ?? Math.max(20, (todaysPlanned?.exercises.length || 1) * 8),
          });
        }
      } else {
        // No session at all — create one
        activeSession = await upsertWorkoutSession({
          workoutDate: today,
          planSessionId: todaysPlanned?.id ?? null,
          status: 'in_progress',
          estimatedDurationMin: Math.max(20, (todaysPlanned?.exercises.length || 1) * 8),
        });
      }

      setSession(activeSession);
      if (activeSession.status !== 'completed') {
        startTimer((activeSession as any).started_at ?? null);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el entrenamiento de hoy');
    } finally {
      setLoading(false);
    }
  }, [today, startTimer]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─ Complete ─────────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!session || saving) return;
    try {
      setSaving(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const actualMin = Math.max(1, Math.round(elapsed / 60));
      const completed = await completeWorkoutSession(session.id, {
        notes,
        actualDurationMin: actualMin,
        workoutType: (session as any).session_name || plannedWorkout?.name || 'general',
      });
      navigate(`/app/workout/summary/${completed.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo completar el entrenamiento');
      setSaving(false);
    }
  };

  // ─ Derived display values ───────────────────────────────────────────────────
  const sessionName   = (session as any)?.session_name || plannedWorkout?.name || 'Entrenamiento libre';
  const category      = (session as any)?.category ?? null;
  const muscleGroup   = (session as any)?.muscle_group ?? null;
  const estimatedMin  = session?.estimated_duration_min ?? 30;
  const exercises     = plannedWorkout?.exercises ?? [];
  const isCompleted   = session?.status === 'completed';
  const catColor      = deriveCategoryColor(category);
  const checkedCount  = checked.size;
  const totalExercises = exercises.length;
  const progress      = totalExercises > 0 ? Math.round((checkedCount / totalExercises) * 100) : isCompleted ? 100 : 0;

  // ─ Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-dark-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-primary-500 animate-spin" />
            </div>
            <p className="text-dark-500 text-sm font-medium">Cargando sesión…</p>
          </div>
        </div>
      </div>
    );
  }

  // ─ Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-dark-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <p className="text-dark-200 font-semibold mb-2">Algo salió mal</p>
            <p className="text-dark-500 text-sm mb-6">{error}</p>
            <button onClick={loadData} className="px-6 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-xl text-sm font-medium transition-colors">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">

        {/* ─── Back ─────────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/app/workout')}
          className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-200 transition-colors mb-7 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Entrenamientos
        </button>

        {/* ─── Hero Header ──────────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {/* Status badge */}
            {isCompleted ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                ✓ Completado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                En progreso
              </span>
            )}
            {/* Category badge */}
            {category && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                {category}
              </span>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-dark-50 tracking-tight leading-tight mb-1">
            {sessionName}
          </h1>
          {muscleGroup && (
            <p className="text-dark-400 text-sm">{muscleGroup}</p>
          )}
          <p className="text-dark-600 text-xs mt-1 capitalize">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* ─── Stats Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Timer */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-1.5">
              {isCompleted ? 'Duración real' : 'Tiempo'}
            </p>
            <p className="text-2xl font-black text-primary-400 tabular-nums leading-none font-mono">
              {isCompleted
                ? `${session?.actual_duration_min ?? estimatedMin} min`
                : formatElapsed(elapsed)}
            </p>
          </div>

          {/* Estimated */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-1.5">Estimado</p>
            <p className="text-2xl font-black text-dark-200 tabular-nums leading-none">
              {estimatedMin} <span className="text-sm font-semibold text-dark-500">min</span>
            </p>
          </div>

          {/* Exercises */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-1.5">Ejercicios</p>
            <p className="text-2xl font-black text-dark-200 tabular-nums leading-none">
              {totalExercises > 0 ? (
                <>
                  <span className={checkedCount === totalExercises ? 'text-emerald-400' : 'text-dark-200'}>
                    {checkedCount}
                  </span>
                  <span className="text-sm font-semibold text-dark-600">/{totalExercises}</span>
                </>
              ) : (
                <span className="text-dark-500 text-base">—</span>
              )}
            </p>
          </div>
        </div>

        {/* ─── Progress Bar (only when there are exercises) ─────────────────── */}
        {totalExercises > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-500 font-semibold">Progreso de la sesión</span>
              <span className="text-xs font-black text-dark-300 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── Exercises Checklist ──────────────────────────────────────────── */}
        {totalExercises > 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-800">
              <h2 className="text-sm font-bold text-dark-200 uppercase tracking-wider">Ejercicios</h2>
              {checkedCount > 0 && !isCompleted && (
                <button
                  onClick={() => setChecked(new Set())}
                  className="text-xs text-dark-600 hover:text-dark-400 transition-colors"
                >
                  Resetear
                </button>
              )}
            </div>
            <ul className="divide-y divide-dark-800/60">
              {exercises.map((ex, idx) => {
                const isDone = checked.has(ex.id) || isCompleted;
                return (
                  <li
                    key={ex.id}
                    onClick={() => {
                      if (isCompleted) return;
                      setChecked(prev => {
                        const next = new Set(prev);
                        if (next.has(ex.id)) next.delete(ex.id);
                        else next.add(ex.id);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-200 select-none
                      ${isDone ? 'bg-emerald-500/5' : 'hover:bg-dark-800/40'}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                      ${isDone
                        ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/30'
                        : 'border-dark-700 bg-dark-950/60 hover:border-primary-500/50'
                      }`}>
                      {isDone && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Number */}
                    <span className={`text-[11px] font-black tabular-nums w-5 text-right flex-shrink-0 transition-colors
                      ${isDone ? 'text-emerald-600' : 'text-dark-700'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {/* Name */}
                    <span className={`flex-1 text-sm font-semibold transition-colors
                      ${isDone ? 'text-dark-500 line-through decoration-dark-600' : 'text-dark-100'}`}>
                      {ex.exercise_name}
                    </span>

                    {/* Sets × Reps */}
                    <span className={`text-xs font-bold tabular-nums flex-shrink-0 transition-colors
                      ${isDone ? 'text-dark-700' : 'text-dark-400'}`}>
                      {ex.sets}×{ex.reps}
                    </span>

                    {/* Weight if present */}
                    {(ex as any).weight_kg && (
                      <span className={`text-xs flex-shrink-0 transition-colors
                        ${isDone ? 'text-dark-700' : 'text-dark-500'}`}>
                        {(ex as any).weight_kg} kg
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          /* No exercises — free session */
          <div className="bg-dark-900 border border-dark-800/60 border-dashed rounded-2xl p-6 mb-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-dark-300 text-sm font-semibold mb-0.5">Entrenamiento libre</p>
              <p className="text-dark-600 text-xs leading-relaxed">
                No hay ejercicios predefinidos. Completa tu entrenamiento y añade notas cuando termines.
              </p>
            </div>
          </div>
        )}

        {/* ─── Notes ────────────────────────────────────────────────────────── */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-dark-800">
            <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            <h2 className="text-sm font-bold text-dark-200 uppercase tracking-wider">Notas de la sesión</h2>
          </div>
          <div className="p-4">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isCompleted}
              rows={4}
              placeholder="¿Cómo te fue? Anota sensaciones, peso usado, observaciones…"
              className="w-full bg-transparent text-dark-200 placeholder:text-dark-700 text-sm leading-relaxed resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* ─── Actions ──────────────────────────────────────────────────────── */}
        {!isCompleted ? (
          <div className="space-y-3">
            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-60 text-white font-black text-base rounded-2xl transition-all duration-200 uppercase tracking-widest shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Completar entrenamiento
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/app/workout')}
              className="w-full py-3.5 bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-dark-200 text-sm font-semibold rounded-2xl transition-all duration-200 border border-dark-800 hover:border-dark-700"
            >
              Continuar después
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Completed state — motivational banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 font-bold text-sm">¡Entrenamiento completado!</p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  Duración: {session?.actual_duration_min ?? estimatedMin} min{' '}
                  {session?.actual_duration_min && session.actual_duration_min > 1 ? '· Excelente trabajo' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => session?.id && navigate(`/app/workout/summary/${session.id}`)}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-black text-base rounded-2xl transition-all duration-200 uppercase tracking-widest shadow-xl shadow-primary-500/25 hover:-translate-y-0.5"
            >
              Ver resumen completo
            </button>

            <button
              onClick={() => navigate('/app/workout')}
              className="w-full py-3.5 bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-dark-200 text-sm font-semibold rounded-2xl transition-all duration-200 border border-dark-800 hover:border-dark-700"
            >
              Volver a Entrenamientos
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
