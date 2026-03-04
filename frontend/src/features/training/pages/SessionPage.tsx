// ============================================================================
// SessionPage — Sesión activa con timer, ejercicios y completar
// Ruta: /app/workout/sesion/:id
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';

import { useActiveSession } from '../hooks/useActiveSession';
import { ConfirmModal }     from '../modals/ConfirmModal';
import { ToastProvider, useToast } from '../components/Toast';
import type { SessionExercise } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const CAT_BADGE: Record<string, string> = {
  fuerza:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hipertrofia: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cardio:      'bg-red-500/10 text-red-400 border-red-500/20',
  general:     'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

// ─── ExerciseRow ─────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise:       SessionExercise;
  index:          number;
  isActive:       boolean;
  onUpdate:       (id: string, sets: number, weight?: number | null) => void;
}

const ExerciseRow: React.FC<ExerciseRowProps> = ({ exercise, index, isActive, onUpdate }) => {
  const [localSets,   setLocalSets]   = useState(exercise.sets_completed ?? 0);
  const [localWeight, setLocalWeight] = useState<string>(
    exercise.weight_kg !== null && exercise.weight_kg !== undefined ? String(exercise.weight_kg) : '',
  );
  const isDone = localSets >= exercise.sets_total;

  const handleSetsChange = (delta: number) => {
    if (!isActive) return;
    const next = Math.max(0, Math.min(exercise.sets_total, localSets + delta));
    setLocalSets(next);
    const wkg = localWeight ? parseFloat(localWeight) || null : null;
    onUpdate(exercise.id, next, wkg);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        isDone
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-dark-900 border-dark-800 hover:border-dark-700'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Index / done check */}
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-all duration-200 ${
            isDone ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-500'
          }`}
        >
          {isDone
            ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            : index + 1
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate transition-colors ${isDone ? 'text-green-300' : 'text-dark-100'}`}>
            {exercise.exercise_name}
          </p>
          <p className="text-xs text-dark-500 mt-0.5">
            {exercise.sets_total} series × {exercise.reps_target} reps
            {exercise.rest_seconds ? ` · ${exercise.rest_seconds}s descanso` : ''}
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Weight input */}
        <div className="flex items-center gap-1.5 flex-1">
          <input
            type="number"
            min={0}
            step={0.5}
            placeholder="0"
            value={localWeight}
            onChange={e => {
              setLocalWeight(e.target.value);
              if (isActive) {
                const wkg = e.target.value ? parseFloat(e.target.value) || null : null;
                onUpdate(exercise.id, localSets, wkg);
              }
            }}
            disabled={!isActive}
            className="w-20 bg-dark-800 border border-dark-700 rounded-xl px-2.5 py-1.5 text-sm text-center text-dark-100 focus:outline-none focus:border-primary-500/50 disabled:opacity-50 tabular-nums"
          />
          <span className="text-xs text-dark-600">kg</span>
        </div>

        {/* Series counter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSetsChange(-1)}
            disabled={!isActive || localSets === 0}
            className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 flex items-center justify-center transition-all duration-150 disabled:opacity-30"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className={`text-sm font-bold tabular-nums w-10 text-center transition-colors ${isDone ? 'text-green-400' : 'text-dark-100'}`}>
            {localSets}/{exercise.sets_total}
          </span>
          <button
            onClick={() => handleSetsChange(1)}
            disabled={!isActive || isDone}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-30 ${
              isDone
                ? 'bg-green-500/15 text-green-400'
                : 'bg-primary-500/15 hover:bg-primary-500/25 text-primary-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notes */}
      {exercise.notes && (
        <p className="mt-2 text-xs text-dark-600 italic border-t border-dark-800/50 pt-2">{exercise.notes}</p>
      )}
    </div>
  );
};

// ─── Page inner ───────────────────────────────────────────────────────────────

const SessionPageInner: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes]             = useState('');
  const [showComplete, setShowComplete] = useState(false);

  const {
    session, loading, saving, error,
    elapsed, exercises, isStarted, isCompleted,
    start, complete, updateExercise,
  } = useActiveSession(id);

  const completedCount = exercises.filter(e => (e.sets_completed ?? 0) >= e.sets_total).length;
  const progress       = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  const handleStart = async () => {
    try {
      await start();
      toast('¡Sesión iniciada! 💪', 'success');
    } catch {
      toast('No se pudo iniciar la sesión', 'error');
    }
  };

  const handleComplete = async () => {
    try {
      await complete(notes);
      toast('¡Sesión completada! 🎉', 'success');
      navigate(`/app/workout/summary/${id}`);
    } catch {
      toast('No se pudo completar la sesión', 'error');
      setShowComplete(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-dark-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-primary-500 animate-spin" />
            </div>
            <p className="text-dark-500 text-sm">Cargando sesión…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !session) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-dark-900 border border-red-500/20 rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-dark-200 font-semibold mb-2">Sesión no encontrada</p>
            <p className="text-dark-500 text-sm mb-5">{error ?? 'No se pudo cargar la sesión.'}</p>
            <button
              onClick={() => navigate('/app/workout')}
              className="px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-xl text-sm font-medium transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cat = session.category ?? 'general';

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-28">

        {/* Back */}
        <button
          onClick={() => navigate('/app/workout')}
          className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-200 transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Entrenamientos
        </button>

        {/* Header card */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-lg font-black text-dark-50">
                  {session.session_name || 'Entrenamiento'}
                </h1>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${CAT_BADGE[cat] ?? CAT_BADGE.general}`}>
                  {cat}
                </span>
              </div>
              {session.muscle_group && (
                <p className="text-xs text-dark-500">{session.muscle_group}</p>
              )}
            </div>

            {/* Status badge */}
            <div className={`shrink-0 px-3 py-1 rounded-xl border text-xs font-bold ${
              isCompleted    ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              isStarted      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                               'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {isCompleted ? 'Completado' : isStarted ? 'En progreso' : 'Planificado'}
            </div>
          </div>

          {/* Timer + Progress */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="bg-dark-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <svg className={`w-4 h-4 ${isStarted ? 'text-amber-400 animate-pulse' : 'text-dark-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-black text-dark-100 tabular-nums font-mono">
                {formatElapsed(elapsed)}
              </span>
            </div>

            {/* Progress bar */}
            {exercises.length > 0 && (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-dark-500">{completedCount}/{exercises.length} ejercicios</span>
                  <span className="text-xs font-bold text-dark-300">{progress}%</span>
                </div>
                <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exercises */}
        {exercises.length > 0 ? (
          <div className="space-y-3 mb-5">
            <h2 className="text-xs font-bold text-dark-500 uppercase tracking-widest px-1">
              Ejercicios ({exercises.length})
            </h2>
            {exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                index={i}
                isActive={isStarted && !isCompleted}
                onUpdate={updateExercise}
              />
            ))}
          </div>
        ) : (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 text-center mb-5">
            <p className="text-sm text-dark-400 font-medium">Entrenamiento libre</p>
            <p className="text-xs text-dark-600 mt-1">Sin ejercicios predefinidos. Registra tu progreso libremente.</p>
          </div>
        )}

        {/* Notes */}
        {(isStarted || isCompleted) && (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 mb-5">
            <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
              Notas de la sesión
            </label>
            <textarea
              rows={3}
              value={notes || session.notes || ''}
              onChange={e => setNotes(e.target.value)}
              disabled={isCompleted}
              placeholder="¿Cómo fue el entrenamiento? Peso logrado, sensaciones…"
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:border-primary-500/50 resize-none transition-colors disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {/* ── Fixed actions bottom bar ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-950/95 backdrop-blur border-t border-dark-800 px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto">
          {!isStarted && !isCompleted ? (
            <button
              onClick={handleStart}
              disabled={saving}
              className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-white rounded-2xl font-black text-base shadow-xl shadow-primary-500/25 transition-all duration-150 disabled:opacity-70"
            >
              {saving ? 'Iniciando…' : '▶  Iniciar sesión'}
            </button>
          ) : isStarted ? (
            <button
              onClick={() => setShowComplete(true)}
              disabled={saving}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-2xl font-black text-base shadow-xl shadow-green-500/25 transition-all duration-150 disabled:opacity-70"
            >
              {saving ? 'Guardando…' : '✓  Completar sesión'}
            </button>
          ) : (
            <button
              onClick={() => navigate(`/app/workout/summary/${id}`)}
              className="w-full py-4 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-2xl font-bold text-sm transition-all duration-150"
            >
              Ver resumen →
            </button>
          )}
        </div>
      </div>

      {/* Confirm complete */}
      <ConfirmModal
        isOpen={showComplete}
        title="Completar sesión"
        message={`¿Listo para terminar? Llevas ${formatElapsed(elapsed)} y ${completedCount} ejercicio${completedCount !== 1 ? 's' : ''} completado${completedCount !== 1 ? 's' : ''}.`}
        confirmLabel="Sí, completar"
        loading={saving}
        onConfirm={handleComplete}
        onCancel={() => setShowComplete(false)}
      />
    </div>
  );
};

export const SessionPage: React.FC = () => (
  <ToastProvider>
    <SessionPageInner />
  </ToastProvider>
);
