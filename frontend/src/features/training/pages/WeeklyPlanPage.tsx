// ============================================================================
// WeeklyPlanPage — Configuración del plan semanal persistente
// Ruta: /app/workout/plan-semanal
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';

import { useWeeklyPlan, DAY_LABELS, DAY_SHORT, getTodayDayOfWeek } from '../hooks/useWeeklyPlan';
import { getRoutines }     from '../services/trainingService';
import { ConfirmModal }    from '../modals/ConfirmModal';
import { ToastProvider, useToast } from '../components/Toast';
import type { Routine }    from '../types';

const CAT_STYLES: Record<string, string> = {
  fuerza:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hipertrofia: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cardio:      'bg-red-500/10 text-red-400 border-red-500/20',
  general:     'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

const DAY_ICONS = ['☀️','⚡','💪','🔥','🏃','🧘','😴'];

// ─── RoutinePickerDropdown ────────────────────────────────────────────────────
interface RoutinePickerProps {
  dayIndex:        number;
  assignedRoutine: Routine | null | undefined;
  routines:        Routine[];
  saving:          boolean;
  onAssign:        (dayIndex: number, routineId: string) => void;
  onRemove:        (dayIndex: number) => void;
}

const RoutinePicker: React.FC<RoutinePickerProps> = ({
  dayIndex, assignedRoutine, routines, saving, onAssign, onRemove,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {assignedRoutine ? (
        /* Assigned — show routine card */
        <div className="flex items-center gap-2 bg-dark-800/50 border border-dark-700 rounded-xl px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-100 truncate">{assignedRoutine.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${CAT_STYLES[assignedRoutine.category] ?? CAT_STYLES.general}`}>
                {assignedRoutine.category}
              </span>
              {assignedRoutine.estimated_duration_min && (
                <span className="text-[10px] text-dark-600">~{assignedRoutine.estimated_duration_min} min</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              disabled={saving}
              onClick={() => setOpen(o => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-150"
              title="Cambiar rutina"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button
              disabled={saving}
              onClick={() => onRemove(dayIndex)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
              title="Quitar rutina"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Not assigned — show add button */
        <button
          disabled={saving}
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-dark-700 hover:border-primary-500/40 hover:bg-primary-500/5 text-sm text-dark-600 hover:text-primary-400 transition-all duration-150 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Asignar rutina
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
            {routines.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-dark-500">Sin rutinas creadas</p>
              </div>
            ) : (
              routines.map(r => (
                <button
                  key={r.id}
                  onClick={() => { onAssign(dayIndex, r.id); setOpen(false); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-dark-700 flex items-center gap-2 transition-colors group border-b border-dark-700/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 group-hover:text-white truncate">{r.name}</p>
                    <p className="text-[10px] text-dark-600 mt-0.5 capitalize">{r.category}</p>
                  </div>
                  {assignedRoutine?.id === r.id && (
                    <svg className="w-4 h-4 text-primary-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const WeeklyPlanPageInner: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const todayDow  = getTodayDayOfWeek();

  const { planMap, loading, saving, error, setDay, removeDay } = useWeeklyPlan();
  const [routines, setRoutines]  = useState<Routine[]>([]);
  const [routinesLoading, setRoutinesLoading] = useState(true);

  // Confirmation modal state
  const [confirmRemove, setConfirmRemove]   = useState<number | null>(null);

  useEffect(() => {
    getRoutines()
      .then(setRoutines)
      .catch(console.error)
      .finally(() => setRoutinesLoading(false));
  }, []);

  const handleAssign = useCallback(async (dayIndex: number, routineId: string) => {
    try {
      await setDay(dayIndex, routineId);
      toast(`${DAY_LABELS[dayIndex]} actualizado`, 'success');
    } catch {
      toast('No se pudo guardar el cambio', 'error');
    }
  }, [setDay, toast]);

  const handleRemoveConfirmed = useCallback(async () => {
    if (confirmRemove === null) return;
    try {
      await removeDay(confirmRemove);
      toast(`${DAY_LABELS[confirmRemove]} sin rutina`, 'info');
    } catch {
      toast('No se pudo quitar la rutina', 'error');
    } finally {
      setConfirmRemove(null);
    }
  }, [confirmRemove, removeDay, toast]);

  const isLoading = loading || routinesLoading;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 lg:py-8">

        {/* Back + Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/workout')}
            className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-200 transition-colors mb-4 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a entrenamientos
          </button>
          <h1 className="text-2xl lg:text-3xl font-black text-dark-50">Plan Semanal</h1>
          <p className="text-sm text-dark-500 mt-1">
            Asigna una rutina a cada día. Los cambios son persistentes y se usarán al crear la sesión diaria.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* No routines warning */}
        {!routinesLoading && routines.length === 0 && (
          <div className="mb-6 bg-dark-900 border border-amber-500/20 rounded-2xl px-5 py-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-dark-200">Aún no tienes rutinas</p>
              <p className="text-xs text-dark-500 mt-0.5">
                Crea tu primera rutina en{' '}
                <button
                  className="text-primary-400 hover:underline"
                  onClick={() => navigate('/app/workout/crear')}
                >
                  Crear entrenamiento
                </button>
                {' '}para poder asignarla a los días.
              </p>
            </div>
          </div>
        )}

        {/* Days grid */}
        <div className="space-y-3">
          {isLoading
            ? [...Array(7)].map((_, i) => (
                <div key={i} className="bg-dark-900 border border-dark-800 rounded-2xl h-20 animate-pulse" />
              ))
            : Array.from({ length: 7 }).map((_, dow) => {
                const day     = planMap[dow];
                const routine = day?.routine ?? null;
                const isToday = dow === todayDow;

                return (
                  <div
                    key={dow}
                    className={`bg-dark-900 border rounded-2xl px-5 py-4 transition-all duration-150 ${
                      isToday ? 'border-primary-500/30 shadow-sm shadow-primary-500/5' : 'border-dark-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Day label */}
                      <div className="w-16 shrink-0 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{DAY_ICONS[dow]}</span>
                          <div>
                            <p className={`text-sm font-bold ${isToday ? 'text-primary-400' : 'text-dark-200'}`}>
                              {DAY_SHORT[dow]}
                            </p>
                            {isToday && (
                              <p className="text-[9px] text-primary-500 font-bold uppercase tracking-wider">hoy</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Picker */}
                      <div className="flex-1 min-w-0">
                        <RoutinePicker
                          dayIndex={dow}
                          assignedRoutine={routine}
                          routines={routines}
                          saving={saving}
                          onAssign={handleAssign}
                          onRemove={(d) => setConfirmRemove(d)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Summary */}
        {!isLoading && (
          <div className="mt-6 bg-dark-900 border border-dark-800 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark-200">
                  {Object.keys(planMap).length} de 7 días configurados
                </p>
                <p className="text-xs text-dark-500 mt-0.5">
                  Los días vacíos abrirán un selector al crear la sesión diaria.
                </p>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, dow) => (
                  <span
                    key={dow}
                    className={`w-2 h-6 rounded-sm transition-colors ${
                      planMap[dow]
                        ? dow === todayDow ? 'bg-primary-500' : 'bg-dark-600'
                        : 'bg-dark-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm remove modal */}
      <ConfirmModal
        isOpen={confirmRemove !== null}
        title="Quitar rutina"
        message={`¿Quieres quitar la rutina asignada a ${confirmRemove !== null ? DAY_LABELS[confirmRemove] : ''}? No se borrarán las sesiones ya creadas.`}
        confirmLabel="Sí, quitar"
        danger
        loading={saving}
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
};

export const WeeklyPlanPage: React.FC = () => (
  <ToastProvider>
    <WeeklyPlanPageInner />
  </ToastProvider>
);
