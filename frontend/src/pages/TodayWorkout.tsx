import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getWeekStart } from '@/features/member/workoutPlan/weekHelpers';
import { getWeeklyPlanFull } from '@/features/member/workoutPlan/api';
import type { SessionWithExercises } from '@/features/member/workoutPlan/types';
import {
  completeWorkoutSession,
  getWorkoutSessionByDate,
  upsertWorkoutSession,
  type WorkoutSessionRecord,
} from '@/services/supabase/workoutSessions';

export const TodayWorkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<WorkoutSessionRecord | null>(null);
  const [plannedWorkout, setPlannedWorkout] = useState<SessionWithExercises | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const weekStart = getWeekStart(today);
      const [plan, todaySession] = await Promise.all([
        getWeeklyPlanFull(weekStart),
        getWorkoutSessionByDate(today),
      ]);

      const todaysPlanned = plan.sessions.find((item) => item.session_date === today) || null;
      setPlannedWorkout(todaysPlanned);

      if (todaySession) {
        setSession(todaySession);
        setNotes(todaySession.notes || '');
      } else {
        const created = await upsertWorkoutSession({
          workoutDate: today,
          planSessionId: todaysPlanned?.id ?? null,
          status: 'in_progress',
          estimatedDurationMin: Math.max(20, (todaysPlanned?.exercises.length || 1) * 8),
        });
        setSession(created);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el entrenamiento de hoy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async () => {
    if (!session) return;

    try {
      setSaving(true);
      const completed = await completeWorkoutSession(session.id, {
        notes,
        actualDurationMin: session.estimated_duration_min ?? undefined,
        workoutType: plannedWorkout?.name || 'manual',
      });

      navigate(`/app/workout/summary/${completed.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo completar el entrenamiento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-dark-900 border border-dark-800 rounded-xl p-6">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Entrenamiento de Hoy</h1>
            <p className="text-sm text-dark-400 mt-1">
              {searchParams.get('manual') === '1' ? 'Registro manual en progreso' : plannedWorkout?.name || 'Sesión del día'}
            </p>
          </div>
          <button onClick={() => navigate('/app')} className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-200">
            Volver al dashboard
          </button>
        </header>

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Estado</p>
              <p className="text-sm font-medium text-dark-100 mt-1">{session?.status === 'completed' ? 'Completado' : 'En progreso'}</p>
            </div>
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Duración estimada</p>
              <p className="text-sm font-medium text-dark-100 mt-1">{session?.estimated_duration_min ?? 20} min</p>
            </div>
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Ejercicios</p>
              <p className="text-sm font-medium text-dark-100 mt-1">{plannedWorkout?.exercises.length ?? 0}</p>
            </div>
          </div>

          {plannedWorkout?.exercises?.length ? (
            <ul className="space-y-2 mb-5">
              {plannedWorkout.exercises.map((exercise) => (
                <li key={exercise.id} className="text-sm text-dark-200 flex items-center justify-between rounded-lg border border-dark-800 px-3 py-2">
                  <span>{exercise.exercise_name}</span>
                  <span className="text-dark-400">{exercise.sets}x{exercise.reps}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-dark-700 px-4 py-6 mb-5 text-sm text-dark-400">
              No hay ejercicios planificados para hoy. Puedes completar igualmente el registro manual.
            </div>
          )}

          <label className="block text-sm text-dark-300 mb-2">Notas de la sesión</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 mb-5 focus:outline-none focus:border-primary-500"
            placeholder="¿Cómo te fue hoy?"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleComplete}
              disabled={saving || session?.status === 'completed'}
              className="px-5 py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-60"
            >
              {session?.status === 'completed' ? 'Entrenamiento completado' : saving ? 'Guardando...' : 'Marcar como completado'}
            </button>
            {session?.status === 'completed' && (
              <button
                onClick={() => navigate(`/app/workout/summary/${session.id}`)}
                className="px-5 py-3 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 font-medium"
              >
                Ver resumen
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
