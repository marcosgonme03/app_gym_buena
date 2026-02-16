import React from 'react';
import type { ClassBooking } from '@/features/classes/types';

interface MyUpcomingBookingsProps {
  bookings: ClassBooking[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCancel: (sessionId: string) => void;
}

export const MyUpcomingBookings: React.FC<MyUpcomingBookingsProps> = ({
  bookings,
  loading,
  error,
  onRetry,
  onCancel,
}) => {
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
      <h3 className="text-sm font-semibold text-dark-100 mb-3">Mis próximas reservas</h3>

      {bookings.length === 0 ? (
        <p className="text-sm text-dark-400">No tienes reservas próximas.</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
          {bookings.map((booking) => {
            const session = booking.class_sessions;
            if (!session) return null;

            const starts = new Date(session.starts_at);
            const title = session.classes.title;

            return (
              <div key={booking.id} className="flex-1 rounded-lg border border-dark-800 bg-dark-950/60 px-3 py-2">
                <p className="text-sm font-medium text-dark-100">{title}</p>
                <p className="text-xs text-dark-400 mt-1">
                  {starts.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                  {' · '}
                  {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <button
                  onClick={() => onCancel(booking.session_id)}
                  className="text-xs text-red-300 hover:text-red-200 mt-2"
                >
                  Cancelar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
