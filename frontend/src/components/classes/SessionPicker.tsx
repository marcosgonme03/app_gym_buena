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
  const grouped = sessions.reduce<Record<string, SessionPickerItem[]>>((acc, session) => {
    const dateKey = new Date(session.startsAt).toISOString().slice(0, 10);
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(session);
    return acc;
  }, {});

  const orderedDays = Object.keys(grouped).sort();

  return (
    <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
      <h3 className="text-sm font-semibold text-dark-100 mb-3">Horarios disponibles</h3>

      {orderedDays.length === 0 ? (
        <p className="text-sm text-dark-400">No hay sesiones próximas en este momento.</p>
      ) : (
        <div className="space-y-4">
          {orderedDays.map((day) => {
            const dayLabel = new Date(day).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            });

            return (
              <div key={day} className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-dark-400">{dayLabel}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grouped[day].map((session) => {
                    const starts = new Date(session.startsAt);
                    const ends = new Date(session.endsAt);
                    const isSelected = selectedSessionId === session.id;
                    const isPast = ends <= new Date();
                    const isFull = session.remainingSpots <= 0 && !session.isBookedByMe;
                    const disabled = session.isCancelled || isPast;

                    let stateText = 'Disponible';
                    if (session.isBookedByMe) stateText = 'Reservada';
                    else if (session.isCancelled) stateText = 'Cancelada';
                    else if (isPast) stateText = 'Pasada';
                    else if (isFull) stateText = 'Completa';

                    return (
                      <button
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        disabled={disabled}
                        aria-label={`Seleccionar sesión ${starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 bg-dark-950/60 hover:border-dark-500'
                        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <p className="text-sm text-dark-100">
                          {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {ends.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-dark-300 mt-1">
                          {session.remainingSpots}/{session.totalSpots} plazas
                        </p>
                        <p className="text-[11px] text-dark-400 mt-1">{stateText}</p>
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
