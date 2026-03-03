import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { getWeekStart } from '@/features/member/workoutPlan/weekHelpers';
import { getWeeklyPlanFull } from '@/features/member/workoutPlan/api';
import { getWorkoutSessionById, type WorkoutSessionRecord } from '@/services/supabase/workoutSessions';
import type { SessionWithExercises } from '@/features/member/workoutPlan/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function deriveCategoryColor(cat?: string | null) {
  switch (cat) {
    case 'fuerza':      return { bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/20'   };
    case 'hipertrofia': return { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/20' };
    case 'cardio':      return { bg: 'bg-red-500/10',    text: 'text-red-300',    border: 'border-red-500/20'    };
    default:            return { bg: 'bg-teal-500/10',   text: 'text-teal-300',   border: 'border-teal-500/20'   };
  }
}

function motivationalMessage(durationMin: number, exerciseCount: number): string {
  if (durationMin >= 60) return '¡Sesión de élite! Más de una hora de puro compromiso 💪';
  if (durationMin >= 45) return '¡Excelente sesión! Consistencia que marca la diferencia 🔥';
  if (exerciseCount >= 8) return '¡Gran variedad de ejercicios! Entrenamiento muy completo ⚡';
  return '¡Gran trabajo! Cada sesión te acerca más a tu mejor versión 🎯';
}

export const WorkoutSummary: React.FC = () => {
  const navigate      = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [session,        setSession]        = useState<WorkoutSessionRecord | null>(null);
  const [plannedWorkout, setPlannedWorkout] = useState<SessionWithExercises | null>(null);

  // ─ Load ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!sessionId) { setError('Sesión no válida'); setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const s = await getWorkoutSessionById(sessionId);
        if (!s) { setError('No se encontró la sesión'); setLoading(false); return; }
        setSession(s);
        const plan = await getWeeklyPlanFull(getWeekStart(s.workout_date));
        setPlannedWorkout(plan.sessions.find(p => p.id === s.plan_session_id) || null);
      } catch (e: any) {
        setError(e.message || 'No se pudo cargar el resumen');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  // ─ Derived values ───────────────────────────────────────────────────────────
  const sessionName   = useMemo(() => (session as any)?.session_name  || plannedWorkout?.name   || 'Entrenamiento',          [session, plannedWorkout]);
  const category      = useMemo(() => (session as any)?.category      ?? null,                                                [session]);
  const muscleGroup   = useMemo(() => (session as any)?.muscle_group  ?? null,                                                [session]);
  const totalWeightKg = useMemo(() => Number((session as any)?.total_weight_kg ?? 0),                                         [session]);
  const exerciseCount = useMemo(() => {
    const fromSess = Number((session as any)?.exercise_count ?? 0);
    return fromSess || (plannedWorkout?.exercises?.length ?? 0);
  }, [session, plannedWorkout]);
  const durationMin   = useMemo(() => session?.actual_duration_min ?? session?.estimated_duration_min ?? 0, [session]);
  const catColor      = deriveCategoryColor(category);
  const exercises     = plannedWorkout?.exercises ?? [];
  const completedAt   = useMemo(() => {
    if (!session?.completed_at) return null;
    return new Date(session.completed_at).toLocaleString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });
  }, [session?.completed_at]);

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
            <p className="text-dark-500 text-sm font-medium">Cargando resumen…</p>
          </div>
        </div>
      </div>
    );
  }

  // ─ Error ────────────────────────────────────────────────────────────────────
  if (error || !session) {
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
            <p className="text-dark-200 font-semibold mb-2">No se pudo cargar</p>
            <p className="text-dark-500 text-sm mb-6">{error || 'Sesión no encontrada'}</p>
            <button onClick={() => navigate('/app/workout')} className="px-6 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-xl text-sm font-medium transition-colors">
              Ver entrenamientos
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
          Historial de entrenamientos
        </button>

        {/* ─── Achievement Banner ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-dark-900 border border-emerald-500/20 rounded-2xl p-6 mb-6">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                Entrenamiento completado ✓
              </span>
              <h1 className="text-2xl font-black text-dark-50 leading-tight mb-1 truncate">{sessionName}</h1>
              <p className="text-sm text-emerald-300/70 leading-relaxed">
                {motivationalMessage(durationMin, exerciseCount)}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Date + Category ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-xs text-dark-500 font-medium capitalize">
            {completedAt || (session.workout_date
              ? new Date(session.workout_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
              : '—')}
          </span>
          {category && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ml-auto ${catColor.bg} ${catColor.text} ${catColor.border}`}>
              {category}
            </span>
          )}
          {muscleGroup && (
            <span className="text-[10px] font-semibold text-dark-400 bg-dark-800 border border-dark-700 px-3 py-1 rounded-full uppercase tracking-wide">
              {muscleGroup}
            </span>
          )}
        </div>

        {/* ─── Stats Grid ───────────────────────────────────────────────────── */}
        <div className={`grid gap-3 mb-6 ${totalWeightKg > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
          {/* Duration */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-0.5">Duración</p>
            <p className="text-xl font-black text-dark-100 tabular-nums leading-none">
              {durationMin}<span className="text-xs font-semibold text-dark-500 ml-0.5">min</span>
            </p>
          </div>

          {/* Exercises */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-0.5">Ejercicios</p>
            <p className="text-xl font-black text-dark-100 tabular-nums leading-none">
              {exerciseCount > 0 ? exerciseCount : <span className="text-dark-500 text-base">—</span>}
            </p>
          </div>

          {/* Effort */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-0.5">Esfuerzo</p>
            <p className="text-lg font-black text-emerald-400 leading-none">
              {durationMin >= 60 ? '⭐⭐⭐' : durationMin >= 45 ? '⭐⭐' : '⭐'}
            </p>
          </div>

          {/* Volume — only when available */}
          {totalWeightKg > 0 && (
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                </svg>
              </div>
              <p className="text-[10px] text-dark-600 uppercase tracking-widest font-bold mb-0.5">Volumen</p>
              <p className="text-xl font-black text-dark-100 tabular-nums leading-none">
                {totalWeightKg.toLocaleString('es-ES')}<span className="text-xs font-semibold text-dark-500 ml-0.5">kg</span>
              </p>
            </div>
          )}
        </div>

        {/* ─── Exercise List ────────────────────────────────────────────────── */}
        {exercises.length > 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden mb-5">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-dark-800">
              <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <h2 className="text-sm font-bold text-dark-200 uppercase tracking-wider">Ejercicios realizados</h2>
              <span className="ml-auto text-xs text-dark-600 font-semibold">{exercises.length} en total</span>
            </div>
            <ul className="divide-y divide-dark-800/60">
              {exercises.map((ex, idx) => (
                <li key={ex.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-black tabular-nums w-5 text-right flex-shrink-0 text-dark-600">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-dark-200">{ex.exercise_name}</span>
                  <span className="text-xs font-bold text-dark-400 tabular-nums flex-shrink-0">{ex.sets}×{ex.reps}</span>
                  {(ex as any).weight_kg && (
                    <span className="text-xs text-dark-500 flex-shrink-0">{(ex as any).weight_kg} kg</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-dark-900 border border-dark-800/60 border-dashed rounded-2xl p-5 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-dark-500 text-sm">Entrenamiento libre — sin ejercicios predefinidos registrados.</p>
          </div>
        )}

        {/* ─── Notes ────────────────────────────────────────────────────────── */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-dark-800">
            <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            <h2 className="text-sm font-bold text-dark-200 uppercase tracking-wider">Notas</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
              {session.notes?.trim()
                ? session.notes.trim()
                : <span className="text-dark-600 italic">Sin notas registradas en esta sesión.</span>
              }
            </p>
          </div>
        </div>

        {/* ─── Actions ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/app/workout/crear')}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-black text-base rounded-2xl transition-all duration-200 uppercase tracking-widest shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo entrenamiento
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/app/workout')}
              className="w-full py-3.5 bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-dark-200 text-sm font-semibold rounded-2xl transition-all duration-200 border border-dark-800 hover:border-dark-700 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Historial
            </button>
            <button
              onClick={() => navigate('/app')}
              className="w-full py-3.5 bg-dark-900 hover:bg-dark-800 text-dark-400 hover:text-dark-200 text-sm font-semibold rounded-2xl transition-all duration-200 border border-dark-800 hover:border-dark-700 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
