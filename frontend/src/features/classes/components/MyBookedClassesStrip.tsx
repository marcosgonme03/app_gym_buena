import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClassBooking } from '@/features/classes/types';

interface MyBookedClassesStripProps {
  bookings: ClassBooking[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCancel: (sessionId: string) => void;
}

export const MyBookedClassesStrip: React.FC<MyBookedClassesStripProps> = ({
  bookings,
  loading,
  error,
  onRetry,
  onCancel,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
        <div className="animate-pulse h-10 bg-dark-800 rounded" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <button onClick={onRetry} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Reintentar</button>
      </section>
    );
  }

  return (
    <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dark-100">Mis clases reservadas</h3>
        <button
          onClick={() => navigate('/app/classes?mine=1')}
          className="text-xs text-primary-300 hover:text-primary-200"
        >
          Ver todas
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-dark-400">No tienes reservas próximas.</p>
      ) : (
        <div className="space-y-2">
          {bookings.slice(0, 5).map((booking) => {
            const session = booking.class_sessions;
            if (!session) return null;

            const starts = new Date(session.starts_at);
            const trainerName = session.classes.users
              ? `${session.classes.users.name} ${session.classes.users.last_name}`
              : 'Entrenador asignado';

            return (
              <div key={booking.id} className="rounded-lg border border-dark-800 bg-dark-950/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-dark-100">{session.classes.title}</p>
                    <p className="text-xs text-dark-400 mt-0.5">
                      {starts.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                      {' · '}
                      {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-dark-500 mt-0.5">{trainerName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] border bg-primary-500/15 text-primary-300 border-primary-500/30">
                      Reservada
                    </span>
                    <button
                      onClick={() => onCancel(booking.session_id)}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
