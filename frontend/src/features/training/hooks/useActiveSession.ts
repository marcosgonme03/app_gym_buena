// ============================================================================
// useActiveSession — Estado de la sesión activa con timer real
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSessionWithExercises,
  startSession,
  completeSession,
  updateSessionExercise,
} from '../services/trainingService';
import type { SessionWithExercises, SessionExercise, CompleteSessionPayload } from '../types';

interface UseActiveSessionResult {
  session:    SessionWithExercises | null;
  loading:    boolean;
  saving:     boolean;
  error:      string | null;
  elapsed:    number;        // segundos
  exercises:  SessionExercise[];
  isStarted:  boolean;
  isCompleted: boolean;
  start:      ()                                                 => Promise<void>;
  complete:   (notes?: string)                                   => Promise<void>;
  updateExercise: (exerciseId: string, setsCompleted: number, weightKg?: number | null) => Promise<void>;
  refresh:    ()                                                 => Promise<void>;
}

export function useActiveSession(sessionId: string | undefined): UseActiveSessionResult {
  const [session,  setSession]  = useState<SessionWithExercises | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [elapsed,  setElapsed]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback((startedAt: string | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const base = startedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
      : 0;
    setElapsed(base);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!sessionId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await getSessionWithExercises(sessionId);
      setSession(data);
      if (data.status === 'in_progress') {
        startTimer(data.started_at);
      } else {
        stopTimer();
        if (data.actual_duration_min) {
          setElapsed(data.actual_duration_min * 60);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // React StrictMode cleanup — safe to ignore
      setError(err.message || 'No se pudo cargar la sesión');
    } finally {
      setLoading(false);
    }
  }, [sessionId, startTimer, stopTimer]);

  useEffect(() => { load(); }, [load]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (!session) return;
    try {
      setSaving(true);
      const updated = await startSession(session.id);
      setSession(prev => prev ? { ...prev, ...updated } : null);
      startTimer(updated.started_at);
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar la sesión');
    } finally {
      setSaving(false);
    }
  }, [session, startTimer]);

  // ── Complete ──────────────────────────────────────────────────────────────
  const complete = useCallback(async (notes?: string) => {
    if (!session) return;
    try {
      setSaving(true);
      stopTimer();
      const actualMin = Math.max(1, Math.round(elapsed / 60));

      const payload: CompleteSessionPayload = {
        actual_duration_min: actualMin,
        notes:               notes ?? session.notes ?? null,
      };

      const updated = await completeSession(session.id, payload);
      setSession(prev => prev ? { ...prev, ...updated } : null);
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la sesión');
      startTimer(session.started_at);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [session, elapsed, stopTimer, startTimer]);

  // ── Update exercise ───────────────────────────────────────────────────────
  const updateExercise = useCallback(async (
    exerciseId: string,
    setsCompleted: number,
    weightKg?: number | null,
  ) => {
    try {
      const updated = await updateSessionExercise(exerciseId, {
        sets_completed: setsCompleted,
        weight_kg:      weightKg,
      });
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map(ex => ex.id === exerciseId ? updated : ex),
        };
      });
    } catch (err: any) {
      console.error('[useActiveSession] updateExercise:', err);
    }
  }, []);

  const exercises  = session?.exercises ?? [];
  const isStarted  = session?.status === 'in_progress';
  const isCompleted = session?.status === 'completed';

  return {
    session, loading, saving, error, elapsed,
    exercises, isStarted, isCompleted,
    start, complete, updateExercise, refresh: load,
  };
}
