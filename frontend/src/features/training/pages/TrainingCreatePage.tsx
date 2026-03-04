// ============================================================================
// TrainingCreatePage — Crear sesión libre (sin rutina)
// Ruta: /app/workout/crear?date=YYYY-MM-DD
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';

import { createFreeSession }            from '../services/trainingService';
import { ToastProvider, useToast }      from '../components/Toast';
import type { WorkoutCategory }         from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: { value: WorkoutCategory; label: string; icon: string; description: string }[] = [
  { value: 'fuerza',      label: 'Fuerza',      icon: '🏋️', description: 'Levantamiento y potencia' },
  { value: 'hipertrofia', label: 'Hipertrofia',  icon: '💪', description: 'Volumen muscular' },
  { value: 'cardio',      label: 'Cardio',       icon: '🏃', description: 'Resistencia aeróbica' },
  { value: 'general',     label: 'General',      icon: '⚡', description: 'Entrenamiento mixto' },
];

const DURATIONS = [
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hora' },
  { value: 75,  label: '1h 15min' },
  { value: 90,  label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps',
  'Piernas', 'Glúteos', 'Core', 'Full body',
];

// ─── Page inner ───────────────────────────────────────────────────────────────

const TrainingCreatePageInner: React.FC = () => {
  const navigate          = useNavigate();
  const [params]          = useSearchParams();
  const { toast }         = useToast();

  // Default date from ?date= param, else today
  const defaultDate = params.get('date') ?? new Date().toISOString().slice(0, 10);

  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState<WorkoutCategory>('general');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [date,        setDate]        = useState(defaultDate);
  const [duration,    setDuration]    = useState(60);
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);

  const isValid = name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    try {
      const session = await createFreeSession({
        session_name: name.trim(),
        category,
        muscle_group: muscleGroup || undefined,
        workout_date: date,
        estimated_duration_min: duration,
        notes: notes.trim() || undefined,
      });

      toast('Sesión creada correctamente', 'success');
      navigate(`/app/workout/sesion/${session.id}`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la sesión';
      toast(msg, 'error');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <form onSubmit={handleSubmit} className="flex-1 w-full max-w-lg mx-auto px-4 py-6">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-200 transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-black text-dark-50">Nueva sesión</h1>
          <p className="text-sm text-dark-500 mt-1">Crea un entrenamiento libre a tu medida</p>
        </div>

        <div className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Pecho y tríceps"
              maxLength={80}
              autoFocus
              className={`w-full bg-dark-900 border rounded-2xl px-4 py-3 text-sm text-dark-100 placeholder-dark-600 focus:outline-none transition-colors ${
                name && !isValid
                  ? 'border-red-500/40 focus:border-red-500/60'
                  : 'border-dark-800 focus:border-primary-500/50'
              }`}
            />
            {name && !isValid && (
              <p className="text-xs text-red-400 mt-1.5 ml-1">Mínimo 2 caracteres</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all duration-150 ${
                    category === cat.value
                      ? 'bg-primary-500/10 border-primary-500/40 shadow-md shadow-primary-500/10'
                      : 'bg-dark-900 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${category === cat.value ? 'text-primary-300' : 'text-dark-200'}`}>
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-dark-600 truncate">{cat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Muscle group */}
          <div>
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
              Grupo muscular <span className="text-dark-700 font-normal normal-case">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setMuscleGroup(prev => prev === mg ? '' : mg)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                    muscleGroup === mg
                      ? 'bg-primary-500/15 border-primary-500/40 text-primary-300'
                      : 'bg-dark-900 border-dark-800 text-dark-400 hover:border-dark-700 hover:text-dark-300'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 focus:border-primary-500/50 rounded-2xl px-3 py-3 text-sm text-dark-100 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
                Duración est.
              </label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full bg-dark-900 border border-dark-800 focus:border-primary-500/50 rounded-2xl px-3 py-3 text-sm text-dark-100 focus:outline-none transition-colors"
              >
                {DURATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">
              Notas <span className="text-dark-700 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Objetivos, ejercicios que planeas hacer…"
              className="w-full bg-dark-900 border border-dark-800 focus:border-primary-500/50 rounded-2xl px-4 py-3 text-sm text-dark-100 placeholder-dark-600 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 bg-dark-900 hover:bg-dark-800 border border-dark-800 hover:border-dark-700 text-dark-300 rounded-2xl font-semibold text-sm transition-all duration-150"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid || saving}
            className="flex-1 py-3.5 bg-primary-500 hover:bg-primary-400 text-white rounded-2xl font-black text-sm shadow-lg shadow-primary-500/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creando…' : 'Crear sesión →'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const TrainingCreatePage: React.FC = () => (
  <ToastProvider>
    <TrainingCreatePageInner />
  </ToastProvider>
);
