import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { useClassDetails } from '@/features/classes/hooks/useClassDetails';
import { useClassSessions } from '@/features/classes/hooks/useClassSessions';
import { useMyBookingsForClass } from '@/features/classes/hooks/useMyBookingsForClass';
import { useBookClass } from '@/features/classes/hooks/useBookClass';
import { useCancelBooking } from '@/features/classes/hooks/useCancelBooking';
import { getWeekStart, getWeekEnd } from '@/features/member/workoutPlan/weekHelpers';

const availabilityStyle = (remaining: number) => {
  if (remaining <= 0) return 'text-red-400';
  if (remaining <= 3) return 'text-yellow-400';
  return 'text-green-400';
};

export const ClassDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: classData, loading, error, refresh } = useClassDetails(slug);

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);
  const range = useMemo(() => ({
    start: `${weekStart}T00:00:00.000Z`,
    end: `${weekEnd}T23:59:59.999Z`,
  }), [weekStart, weekEnd]);

  const {
    data: sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refresh: refreshSessions,
  } = useClassSessions(classData?.id, range);

  const {
    data: myBookings,
    loading: bookingsLoading,
    error: bookingsError,
    refresh: refreshBookings,
  } = useMyBookingsForClass(classData?.id);

  const { mutate: reserveClass, loading: reserving } = useBookClass();
  const { mutate: cancelClass, loading: cancelling } = useCancelBooking();

  const syncAll = async () => {
    await Promise.all([refreshSessions(), refreshBookings()]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24 lg:pb-8">
        <BottomNav />
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
          <div className="animate-pulse h-80 rounded-xl bg-dark-800" />
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24 lg:pb-8">
        <BottomNav />
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 mb-2">{error || 'Clase no encontrada'}</p>
            <button onClick={refresh} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  const cover = classData.cover_image_url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80';
  const trainer = classData.users ? `${classData.users.name} ${classData.users.last_name}` : 'Por asignar';

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24 lg:pb-8">
      <BottomNav />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <button onClick={() => navigate('/app/classes')} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">
          ← Volver a Clases
        </button>

        <section className="rounded-2xl overflow-hidden border border-dark-800 bg-dark-900">
          <div className="relative h-64 md:h-80">
            <img src={cover} alt={classData.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{classData.title}</h1>
              <p className="text-sm text-gray-200 mt-2 max-w-3xl">{classData.description || 'Sin descripción disponible.'}</p>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Entrenador</p>
              <p className="text-sm text-dark-100 mt-1">{trainer}</p>
            </div>
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Nivel</p>
              <p className="text-sm text-dark-100 mt-1">{classData.level || 'Todos'}</p>
            </div>
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Duración</p>
              <p className="text-sm text-dark-100 mt-1">{classData.duration_min} min</p>
            </div>
            <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
              <p className="text-xs text-dark-400">Capacidad base</p>
              <p className="text-sm text-dark-100 mt-1">{classData.capacity}</p>
            </div>
          </div>
        </section>

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-dark-50 mb-3">Mis próximas reservas</h2>
          {bookingsLoading ? (
            <div className="animate-pulse h-12 bg-dark-800 rounded" />
          ) : bookingsError ? (
            <p className="text-sm text-red-300">{bookingsError}</p>
          ) : myBookings.length === 0 ? (
            <p className="text-sm text-dark-400">Aún no tienes reservas para esta clase.</p>
          ) : (
            <div className="space-y-2">
              {myBookings.map((booking) => {
                const session = booking.class_sessions;
                if (!session) return null;
                const starts = new Date(session.starts_at);
                return (
                  <div key={booking.id} className="rounded-lg border border-dark-800 bg-dark-950/60 px-3 py-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-dark-100">
                      {starts.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                      {' · '}
                      {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button
                      onClick={async () => {
                        await cancelClass(booking.session_id);
                        await syncAll();
                      }}
                      disabled={cancelling}
                      className="text-xs text-red-300 hover:text-red-200 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-dark-50 mb-3">Horarios disponibles</h2>

          {sessionsLoading ? (
            <div className="animate-pulse h-20 bg-dark-800 rounded" />
          ) : sessionsError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-300 mb-2">{sessionsError}</p>
              <button onClick={refreshSessions} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Reintentar</button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-dark-400">No hay sesiones futuras para esta clase.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const starts = new Date(session.starts_at);
                const ends = new Date(session.ends_at);
                const capacity = session.capacity_override ?? session.classes.capacity;
                const isBooked = session.availabilityState === 'booked';
                const isCancelled = session.availabilityState === 'cancelled';
                const isFull = session.availabilityState === 'full';

                return (
                  <article key={session.id} className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-dark-100">
                          {starts.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' })}
                          {' · '}
                          {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {ends.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className={`text-xs mt-1 ${availabilityStyle(session.remainingSpots)}`}>
                          {session.remainingSpots}/{capacity} plazas libres
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCancelled && (
                          <span className="px-2 py-1 rounded-full text-[11px] border bg-dark-700 text-dark-300 border-dark-600">
                            Cancelada
                          </span>
                        )}

                        {isBooked && (
                          <button
                            onClick={async () => {
                              await cancelClass(session.id);
                              await syncAll();
                            }}
                            disabled={cancelling}
                            className="px-3 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-sm disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        )}

                        {!isBooked && !isCancelled && (
                          <button
                            onClick={async () => {
                              await reserveClass(session.id);
                              await syncAll();
                            }}
                            disabled={isFull || reserving}
                            className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm disabled:opacity-60"
                          >
                            {isFull ? 'Completa' : session.remainingSpots <= 3 ? 'Últimas plazas' : 'Reservar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
