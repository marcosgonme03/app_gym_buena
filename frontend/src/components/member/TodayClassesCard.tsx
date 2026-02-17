import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { useMyTodayClass } from '@/features/classes/hooks/useMyTodayClass';

export const TodayClassesCard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useMyTodayClass();
  const { data: suggestions } = useClasses({ onlyActive: true, daysAhead: 7 });

  if (loading) {
    return (
      <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
        <div className="animate-pulse h-20 rounded-lg bg-dark-800" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-sm text-red-300">{error}</p>
      </section>
    );
  }

  const todayBooking = data.todayClass;

  return (
    <section className="rounded-xl border border-dark-800 bg-dark-900 p-4 space-y-4">
      <h3 className="text-base font-semibold text-dark-50">Tu próxima clase</h3>

      {!todayBooking?.class_sessions ? (
        <div className="space-y-3">
          <p className="text-sm text-dark-300">Hoy no tienes clase</p>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/app/classes/${item.slug}`)}
                className="w-full text-left rounded-lg border border-dark-800 bg-dark-950/60 px-3 py-2 hover:border-dark-600"
              >
                <p className="text-sm text-dark-100">{item.title}</p>
                <p className="text-xs text-dark-400">{item.level || 'Todos los niveles'} · {item.duration_min} min</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3 space-y-2">
          <p className="text-sm font-medium text-dark-100">{todayBooking.class_sessions.classes.title}</p>
          <p className="text-xs text-dark-300">
            {new Date(todayBooking.class_sessions.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(todayBooking.class_sessions.ends_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-dark-400">Estado: Confirmada</p>
          <button
            onClick={() => {
              const targetSlug = todayBooking.class_sessions?.classes.slug;
              if (targetSlug) navigate(`/app/classes/${targetSlug}`);
            }}
            className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm"
          >
            Ver detalle
          </button>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-dark-100 mb-2">Próximas reservas</h4>
        {data.upcoming.length === 0 ? (
          <p className="text-xs text-dark-400">No tienes próximas reservas.</p>
        ) : (
          <div className="space-y-2">
            {data.upcoming.slice(0, 3).map((booking) => {
              const session = booking.class_sessions;
              if (!session) return null;

              return (
                <div key={booking.id} className="rounded-lg border border-dark-800 bg-dark-950/60 p-2">
                  <p className="text-xs text-dark-100">{session.classes.title}</p>
                  <p className="text-[11px] text-dark-400">
                    {new Date(session.starts_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    {' · '}
                    {new Date(session.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
