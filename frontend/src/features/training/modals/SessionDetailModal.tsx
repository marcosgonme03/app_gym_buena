// ============================================================================
// SessionDetailModal — Detalle de sesión del historial
// ============================================================================

import React, { useEffect, useState } from 'react';
import { getSessionWithExercises } from '../services/trainingService';
import type { HistoryItem, SessionWithExercises } from '../types';

const CAT_STYLES: Record<string, string> = {
  fuerza:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hipertrofia: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cardio:      'bg-red-500/10 text-red-400 border-red-500/20',
  general:     'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

interface SessionDetailModalProps {
  item:     HistoryItem | null;
  onClose:  () => void;
  onRepeat: (item: HistoryItem) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ item, onClose, onRepeat }) => {
  const [detail,  setDetail]  = useState<SessionWithExercises | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) { setDetail(null); return; }
    setLoading(true);
    getSessionWithExercises(item.id)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [item?.id]);

  if (!item) return null;
  const cat = CAT_STYLES[item.category] ?? CAT_STYLES.general;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-dark-800 flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-dark-50 truncate">{item.session_name}</h2>
              <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cat}`}>
                {item.category}
              </span>
            </div>
            <p className="text-xs text-dark-500">
              {new Date(item.workout_date + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-dark-800">
          {[
            { v: item.actual_duration_min ? `${item.actual_duration_min} min` : '—', l: 'Duración' },
            { v: item.exercise_count || '—',                                            l: 'Ejercicios' },
            { v: item.total_weight_kg ? `${item.total_weight_kg} kg` : '—',             l: 'Volumen' },
          ].map(m => (
            <div key={m.l} className="bg-dark-800/50 rounded-xl px-3 py-3 text-center">
              <p className="text-lg font-black text-dark-100 tabular-nums">{m.v}</p>
              <p className="text-[10px] text-dark-600 mt-0.5">{m.l}</p>
            </div>
          ))}
        </div>

        {/* Completed at */}
        {item.completed_at && (
          <div className="px-5 py-3 border-b border-dark-800">
            <p className="text-xs text-dark-500">
              Completado: <span className="text-dark-400">{formatDateTime(item.completed_at)}</span>
            </p>
          </div>
        )}

        {/* Exercises */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-dark-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : detail?.exercises && detail.exercises.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
                Ejercicios ({detail.exercises.length})
              </p>
              {detail.exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 bg-dark-800/40 rounded-xl px-3.5 py-2.5"
                >
                  <span className="w-5 h-5 rounded-lg bg-dark-700 flex items-center justify-center text-[10px] font-bold text-dark-500 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 truncate">{ex.exercise_name}</p>
                    <p className="text-[10px] text-dark-600">
                      {ex.sets_total} series × {ex.reps_target} reps
                      {ex.weight_kg ? ` · ${ex.weight_kg} kg` : ''}
                    </p>
                  </div>
                  {(ex.sets_completed ?? 0) >= ex.sets_total && (
                    <span className="text-green-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-dark-500 text-center py-4">Sin ejercicios registrados</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-dark-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-dark-700 text-sm font-semibold text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-all duration-150"
          >
            Cerrar
          </button>
          <button
            onClick={() => { onRepeat(item); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-sm font-semibold text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-all duration-150"
          >
            ↩ Repetir sesión
          </button>
        </div>
      </div>
    </div>
  );
};
