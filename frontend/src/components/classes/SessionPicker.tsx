import React from 'react';

export interface SessionPickerItem {
  id: string;
  startsAt: string;
  endsAt: string;
  remainingSpots: number;
  totalSpots: number;
  isCancelled: boolean;
  isBookedByMe: boolean;
}

interface SessionPickerProps {
  sessions: SessionPickerItem[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export const SessionPicker: React.FC<SessionPickerProps> = ({ sessions, selectedSessionId, onSelectSession }) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups = sessions.reduce<Record<'Hoy' | 'Mañana' | 'Próximos días', SessionPickerItem[]>>(
    (acc, session) => {
      const starts = new Date(session.startsAt);
      const isToday = starts.toDateString() === now.toDateString();
      const isTomorrow = starts.toDateString() === tomorrow.toDateString();

      if (isToday) acc.Hoy.push(session);
      else if (isTomorrow) acc.Mañana.push(session);
      else acc['Próximos días'].push(session);

      return acc;
    },
    { Hoy: [], Mañana: [], 'Próximos días': [] }
  );

  const orderedGroups: Array<'Hoy' | 'Mañana' | 'Próximos días'> = ['Hoy', 'Mañana', 'Próximos días'];
  const hasAnySession = sessions.length > 0;

  return (
    <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
      <h3 className="text-sm font-semibold text-dark-100 mb-3">Horarios disponibles</h3>

      {!hasAnySession ? (
        <p className="text-sm text-dark-400">No hay sesiones próximas en este momento.</p>
      ) : (
        <div className="space-y-4">
          {orderedGroups.map((groupLabel) => {
            const groupSessions = groups[groupLabel];
            if (groupSessions.length === 0) return null;

            return (
              <div key={groupLabel} className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-dark-400">{groupLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {groupSessions.map((session) => {
                    const starts = new Date(session.startsAt);
                    const ends = new Date(session.endsAt);
                    const isSelected = selectedSessionId === session.id;
                    const isPast = ends <= new Date();
                    const isFull = session.remainingSpots <= 0 && !session.isBookedByMe;
                    const disabled = session.isCancelled || isPast;
                    const lowSpots = session.remainingSpots > 0 && session.remainingSpots <= 3;

                    let stateText = 'Disponible';
                    if (session.isBookedByMe) stateText = 'Reservada';
                    else if (session.isCancelled) stateText = 'Cancelada';
                    else if (isPast) stateText = 'Pasada';
                    else if (isFull) stateText = 'Completa';
                    else if (lowSpots) stateText = 'Últimas plazas';

                    const stateClass = session.isCancelled || isPast
                      ? 'text-dark-500'
                      : isFull
                      ? 'text-red-300'
                      : lowSpots
                      ? 'text-yellow-300'
                      : 'text-green-300';

                    return (
                      <button
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        disabled={disabled}
                        aria-label={`Seleccionar sesión ${starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                        className={`px-3 py-2 rounded-full border text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-900/20'
                            : 'border-dark-700 bg-dark-950/60 hover:border-dark-500 hover:bg-dark-800/70'
                        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <p className="text-xs text-dark-100 font-medium">
                          {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[11px] text-dark-300 mt-0.5">
                          {session.remainingSpots}/{session.totalSpots} plazas
                        </p>
                        <p className={`text-[11px] mt-0.5 ${stateClass}`}>{stateText}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
