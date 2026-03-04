// ============================================================================
// DaySessionCard — Tarjeta/panel del día seleccionado en el calendario
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../types';

const STATUS_STYLES: Record<string, { label: string; badge: string; action: string; actionClass: string }> = {
  planned: {
    label: 'Planificado',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    action: '▶ Iniciar',
    actionClass: 'bg-primary-500 hover:bg-primary-400 text-white',
  },
  not_started: {
    label: 'Sin iniciar',
    badge: 'bg-dark-700 text-dark-400 border-dark-700',
    action: '▶ Iniciar',
    actionClass: 'bg-primary-500 hover:bg-primary-400 text-white',
  },
  in_progress: {
    label: 'En progreso',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    action: '⚡ Continuar',
    actionClass: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30',
  },
  completed: {
    label: 'Completado',
    badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    action: '✓ Ver resumen',
    actionClass: 'bg-dark-800 hover:bg-dark-700 text-dark-200',
  },
  cancelled: {
    label: 'Cancelado',
    badge: 'bg-dark-800 text-dark-500 border-dark-700',
    action: 'Repetir',
    actionClass: 'bg-dark-800 hover:bg-dark-700 text-dark-300',
  },
};

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface DaySessionCardProps {
  date:        string;
  sessions:    WorkoutSession[];
  loading:     boolean;
  onCreateDay: (date: string) => void;
}

export const DaySessionCard: React.FC<DaySessionCardProps> = ({
  date, sessions, loading, onCreateDay,
}) => {
  const navigate = useNavigate();
  const todayISO = new Date().toISOString().split('T')[0];
  const isToday  = date === todayISO;

  const handleAction = (session: WorkoutSession) => {
    if (session.status === 'completed') {
      navigate(`/app/workout/summary/${session.id}`);
    } else {
      navigate(`/app/workout/sesion/${session.id}`);
    }
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-dark-800/60 flex items-center justify-between">
        <div>
          <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-0.5">
            {isToday ? 'Hoy' : 'Día seleccionado'}
          </p>
          <h3 className="text-sm font-bold text-dark-100 capitalize">{formatDate(date)}</h3>
        </div>
        {isToday && (
          <span className="px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 text-[10px] font-bold uppercase tracking-wider border border-primary-500/20">
            HOY
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 bg-dark-800 rounded-xl" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map(s => {
              const styles = STATUS_STYLES[s.status] ?? STATUS_STYLES.planned;
              return (
                <div
                  key={s.id}
                  className="bg-dark-800/50 border border-dark-800 rounded-xl p-3.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-dark-100 truncate">
                        {s.session_name || 'Entrenamiento libre'}
                      </p>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                        {styles.label}
                      </span>
                    </div>
                    {(s.estimated_duration_min || s.actual_duration_min) && (
                      <p className="text-xs text-dark-500">
                        {s.status === 'completed'
                          ? `${s.actual_duration_min} min completados`
                          : `~${s.estimated_duration_min} min estimados`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAction(s)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${styles.actionClass}`}
                  >
                    {styles.action}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-dark-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-dark-400 font-medium">Sin sesión para este día</p>
              <p className="text-xs text-dark-600 mt-0.5">Crea una sesión para empezar</p>
            </div>
            <button
              onClick={() => onCreateDay(date)}
              className="px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 hover:bg-primary-500/20 transition-all duration-150"
            >
              + Crear sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
