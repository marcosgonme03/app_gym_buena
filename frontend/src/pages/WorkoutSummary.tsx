import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWeekStart } from '@/features/member/workoutPlan/weekHelpers';
import { getWeeklyPlanFull } from '@/features/member/workoutPlan/api';
import { getWorkoutSessionById, type WorkoutSessionRecord } from '@/services/supabase/workoutSessions';
import type { SessionWithExercises } from '@/features/member/workoutPlan/types';

export const WorkoutSummary: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<WorkoutSessionRecord | null>(null);
  const [plannedWorkout, setPlannedWorkout] = useState<SessionWithExercises | null>(null);

  const completedAtLabel = useMemo(() => {
    if (!session?.completed_at) return 'No disponible';
    return new Date(session.completed_at).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [session?.completed_at]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!sessionId) {
        setError('Sesión no válida');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const currentSession = await getWorkoutSessionById(sessionId);
        if (!currentSession) {
          setError('No se encontró la sesión');
          return;
        }

        setSession(currentSession);

        const weekStart = getWeekStart(currentSession.workout_date);
        const plan = await getWeeklyPlanFull(weekStart);
        const matchingPlanSession = plan.sessions.find(item => item.id === currentSession.plan_session_id) || null;
        setPlannedWorkout(matchingPlanSession);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el resumen');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-dark-950 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-dark-900 border border-dark-800 rounded-xl p-6">
          <p className="text-red-400 mb-4">{error || 'No hay datos para mostrar'}</p>
          <button onClick={() => navigate('/app')} className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100">Volver al dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Resumen del entrenamiento</h1>
            <p className="text-sm text-dark-400 mt-1">Completado: {completedAtLabel}</p>
          </div>
          <button onClick={() => navigate('/app')} className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-200">
            Volver al dashboard
          </button>
        </header>

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Estado</p>
              <p className="text-sm font-medium text-green-400 mt-1">Completado</p>
            </div>
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Duración real</p>
              <p className="text-sm font-medium text-dark-100 mt-1">{session.actual_duration_min ?? session.estimated_duration_min ?? 0} min</p>
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
              Esta sesión fue registrada manualmente sin ejercicios planificados.
            </div>
          )}

          <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-4">
            <p className="text-xs text-dark-400 mb-1">Notas</p>
            <p className="text-sm text-dark-200">{session.notes || 'Sin notas registradas.'}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
