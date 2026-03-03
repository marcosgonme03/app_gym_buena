import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { supabase } from '@/lib/supabase/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toISO = (d: Date) => d.toISOString().split('T')[0];
const todayISO = toISO(new Date());

const CATEGORIES = [
  { id: 'fuerza',      label: 'Fuerza',      description: 'Press, sentadilla, peso muerto…',  color: 'blue'   },
  { id: 'hipertrofia', label: 'Hipertrofia', description: 'Volumen, series largas…',           color: 'purple' },
  { id: 'cardio',      label: 'Cardio',      description: 'HIIT, correr, bici…',               color: 'red'    },
  { id: 'general',     label: 'General',     description: 'Entrenamiento libre o mixto',        color: 'teal'   },
];

const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps',
  'Core', 'Glúteos', 'Full Body', 'Cardio / HIIT',
];

const DURATIONS = [20, 30, 45, 60, 75, 90];

const catBorderActive: Record<string, string> = {
  blue:   'border-blue-500/50 bg-blue-500/10',
  purple: 'border-purple-500/50 bg-purple-500/10',
  red:    'border-red-500/50 bg-red-500/10',
  teal:   'border-teal-500/50 bg-teal-500/10',
};
const catBorderIdle: Record<string, string> = {
  blue:   'border-dark-700 hover:border-blue-500/30 hover:bg-blue-500/5',
  purple: 'border-dark-700 hover:border-purple-500/30 hover:bg-purple-500/5',
  red:    'border-dark-700 hover:border-red-500/30 hover:bg-red-500/5',
  teal:   'border-dark-700 hover:border-teal-500/30 hover:bg-teal-500/5',
};
const catTextActive: Record<string, string> = {
  blue:   'text-blue-300',
  purple: 'text-purple-300',
  red:    'text-red-300',
  teal:   'text-teal-300',
};
const catTextIdle: Record<string, string> = {
  blue:   'text-dark-400 group-hover:text-blue-400',
  purple: 'text-dark-400 group-hover:text-purple-400',
  red:    'text-dark-400 group-hover:text-red-400',
  teal:   'text-dark-400 group-hover:text-teal-400',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const WorkoutCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [sessionDate,   setSessionDate]   = useState(searchParams.get('date') || todayISO);
  const [sessionName,   setSessionName]   = useState('');
  const [category,      setCategory]      = useState<string>('fuerza');
  const [muscleGroup,   setMuscleGroup]   = useState<string>('');
  const [durationMin,   setDurationMin]   = useState<number>(45);
  const [notes,         setNotes]         = useState('');

  // Form submission
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) { setError('El nombre del entrenamiento es obligatorio.'); return; }
    setError(null);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás autenticado');

      // Try full insert with new columns; fall back if migration hasn't run yet
      const fullPayload: Record<string, any> = {
        user_id:                user.id,
        workout_date:           sessionDate,
        status:                 'not_started',
        session_name:           sessionName.trim(),
        category,
        muscle_group:           muscleGroup || null,
        estimated_duration_min: durationMin,
        notes:                  notes.trim() || null,
      };

      let insertRes = await supabase.from('workout_sessions').insert(fullPayload);

      // If new columns don't exist yet (400), retry without them
      if (insertRes.error && insertRes.status === 400 && insertRes.error.code !== '23505') {
        const basePayload: Record<string, any> = {
          user_id:                user.id,
          workout_date:           sessionDate,
          status:                 'not_started',
          estimated_duration_min: durationMin,
        };
        insertRes = await supabase.from('workout_sessions').insert(basePayload);
      }

      const insertErr = insertRes.error;
      if (insertErr) {
        // Unique violation — session already exists for this date
        if (insertErr.code === '23505') {
          setError('Ya existe un entrenamiento registrado para esta fecha. Puedes editarlo desde la pantalla principal.');
          return;
        }
        throw insertErr;
      }

      // Navigate — if today, go directly into the active workout session
      const isToday = sessionDate === todayISO;
      navigate(isToday ? '/app/workout/today' : `/app/workout?date=${sessionDate}`, { replace: true });
    } catch (err: any) {
      console.error('[WorkoutCreatePage] submit:', err);
      setError(err.message || 'Error al guardar el entrenamiento. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-200 transition-colors mb-5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Entrenamientos
          </button>
          <h1 className="text-3xl font-black text-dark-50 tracking-tight">Crear Entrenamiento</h1>
          <p className="text-dark-500 text-sm mt-1">
            {sessionDate === todayISO
              ? 'Añade un entrenamiento para hoy.'
              : `Añade un entrenamiento para el ${new Date(sessionDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Date */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-3">
              Fecha
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 text-dark-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
          </div>

          {/* Session name */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-3">
              Nombre del entrenamiento *
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Ej. Pecho y Tríceps, Piernas, HIIT…"
              maxLength={80}
              className="w-full bg-dark-800 border border-dark-700 text-dark-100 text-sm px-4 py-3 rounded-xl placeholder:text-dark-600 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
          </div>

          {/* Category */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-4">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`group flex flex-col items-start gap-0.5 p-4 rounded-xl border text-left transition-all duration-200
                      ${isActive ? catBorderActive[cat.color] : catBorderIdle[cat.color]}`}
                  >
                    <span className={`text-sm font-bold transition-colors
                      ${isActive ? catTextActive[cat.color] : catTextIdle[cat.color]}`}
                    >
                      {cat.label}
                    </span>
                    <span className="text-[11px] text-dark-600">{cat.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Muscle group */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-4">
              Grupo muscular principal
            </label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setMuscleGroup(muscleGroup === mg ? '' : mg)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150
                    ${muscleGroup === mg
                      ? 'bg-primary-500/15 text-primary-300 border-primary-500/30'
                      : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-dark-600 hover:text-dark-200'
                    }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-4">
              Duración estimada
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMin(d)}
                  className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-150
                    ${durationMin === d
                      ? 'bg-primary-500/15 text-primary-300 border-primary-500/30'
                      : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-dark-600 hover:text-dark-200'
                    }`}
                >
                  {d} min
                </button>
              ))}
              {/* Custom duration */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={DURATIONS.includes(durationMin) ? '' : durationMin}
                  onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) setDurationMin(v); }}
                  placeholder="Otro…"
                  className="w-20 bg-dark-800 border border-dark-700 text-dark-200 text-sm px-3 py-2 rounded-xl text-center placeholder:text-dark-600 focus:outline-none focus:border-primary-500/60 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Notes (optional) */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-widest mb-3">
              Notas <span className="normal-case font-normal text-dark-600">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Objetivos, variaciones, estado físico…"
              rows={3}
              maxLength={500}
              className="w-full bg-dark-800 border border-dark-700 text-dark-100 text-sm px-4 py-3 rounded-xl placeholder:text-dark-600 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 transition-all resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition-all duration-200 uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar entrenamiento
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="px-6 py-3.5 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm font-semibold rounded-xl transition-all border border-dark-700 hover:border-dark-600 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkoutCreatePage;
