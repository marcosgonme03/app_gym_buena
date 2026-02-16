import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { addWeeks, formatWeekRange, getWeekEnd, getWeekStart } from '@/features/member/workoutPlan/weekHelpers';
import type { ClassesFilters, SessionWithAvailability } from '@/features/classes/types';
import { useClassesWeek } from '@/features/classes/hooks/useClassesWeek';
import { useMyBookings } from '@/features/classes/hooks/useMyBookings';
import { useBookClass } from '@/features/classes/hooks/useBookClass';
import { useCancelBooking } from '@/features/classes/hooks/useCancelBooking';
import { WeeklyCalendar } from '@/features/classes/components/WeeklyCalendar';
import { FiltersBar } from '@/features/classes/components/FiltersBar';
import { MyUpcomingBookings } from '@/features/classes/components/MyUpcomingBookings';
import { ClassDetailsModal } from '@/features/classes/components/ClassDetailsModal';
import {
  createClass,
  createClassSession,
  fetchTrainerSessionsWithBookings,
  markAttendance,
  updateClass,
} from '@/features/classes/services/classesService';

const defaultFilters: ClassesFilters = {
  search: '',
  level: 'all',
  trainerUserId: 'all',
  day: 'all',
  onlyAvailable: false,
};

export const ClassesPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(getWeekStart());
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const [filters, setFilters] = useState<ClassesFilters>(defaultFilters);
  const [selectedSession, setSelectedSession] = useState<SessionWithAvailability | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: sessions, trainers, loading, error, refresh } = useClassesWeek(weekStart, weekEnd, filters);
  const { data: myBookings, loading: bookingsLoading, error: bookingsError, refresh: refreshBookings } = useMyBookings();

  const { mutate: reserveClass, loading: bookingLoading } = useBookClass();
  const { mutate: cancelBooking, loading: cancellingLoading } = useCancelBooking();

  const [trainerRows, setTrainerRows] = useState<any[]>([]);
  const [trainerLoading, setTrainerLoading] = useState(false);

  const [adminClassForm, setAdminClassForm] = useState({
    title: '',
    description: '',
    trainer_user_id: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration_min: 60,
    capacity: 12,
  });
  const [adminSessionForm, setAdminSessionForm] = useState({
    class_id: '',
    starts_at: '',
    ends_at: '',
    capacity_override: '',
  });

  useEffect(() => {
    if (profile?.role === 'trainer') {
      const loadTrainerRows = async () => {
        try {
          setTrainerLoading(true);
          const rows = await fetchTrainerSessionsWithBookings(weekStart, weekEnd);
          setTrainerRows(rows);
        } catch (err: any) {
          setFeedback({ type: 'error', text: err.message || 'No se pudieron cargar asistentes' });
        } finally {
          setTrainerLoading(false);
        }
      };
      loadTrainerRows();
    }
  }, [profile?.role, weekStart, weekEnd]);

  const handleWeekChange = (delta: number) => {
    setWeekStart(prev => addWeeks(prev, delta));
  };

  const syncAll = async () => {
    await Promise.all([refresh(), refreshBookings()]);
    if (profile?.role === 'trainer') {
      const rows = await fetchTrainerSessionsWithBookings(weekStart, weekEnd);
      setTrainerRows(rows);
    }
  };

  const handleReserve = async (session: SessionWithAvailability) => {
    try {
      await reserveClass(session.id);
      setFeedback({ type: 'success', text: 'Reserva confirmada' });
      await syncAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo reservar' });
    }
  };

  const handleCancel = async (session: SessionWithAvailability) => {
    try {
      await cancelBooking(session.id);
      setFeedback({ type: 'success', text: 'Reserva cancelada' });
      await syncAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo cancelar' });
    }
  };

  const handleCancelFromStrip = async (sessionId: string) => {
    try {
      await cancelBooking(sessionId);
      setFeedback({ type: 'success', text: 'Reserva cancelada' });
      await syncAll();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo cancelar' });
    }
  };

  const handleMarkAttendance = async (bookingId: string, status: 'attended' | 'no_show') => {
    try {
      const result = await markAttendance(bookingId, status);
      if (!result.success) throw new Error(result.message || 'No se pudo marcar asistencia');
      setFeedback({ type: 'success', text: 'Asistencia actualizada' });
      const rows = await fetchTrainerSessionsWithBookings(weekStart, weekEnd);
      setTrainerRows(rows);
      await refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error al marcar asistencia' });
    }
  };

  const handleAdminCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createClass(adminClassForm);
      setFeedback({ type: 'success', text: `Clase ${created.title} creada` });
      setAdminClassForm({
        title: '',
        description: '',
        trainer_user_id: adminClassForm.trainer_user_id,
        level: 'beginner',
        duration_min: 60,
        capacity: 12,
      });
      await refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo crear la clase' });
    }
  };

  const handleAdminCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClassSession({
        class_id: adminSessionForm.class_id,
        starts_at: adminSessionForm.starts_at,
        ends_at: adminSessionForm.ends_at,
        capacity_override: adminSessionForm.capacity_override ? Number(adminSessionForm.capacity_override) : null,
      });
      setFeedback({ type: 'success', text: 'Sesión creada' });
      setAdminSessionForm({ class_id: '', starts_at: '', ends_at: '', capacity_override: '' });
      await refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo crear la sesión' });
    }
  };

  const role = profile?.role || 'member';

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24 lg:pb-8">
      <BottomNav />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Clases</h1>
            <p className="text-sm text-dark-400">Semana {formatWeekRange(weekStart)}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleWeekChange(-1)} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">← Semana anterior</button>
            <button onClick={() => handleWeekChange(1)} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Semana siguiente →</button>
            <button onClick={() => navigate('/app')} className="px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm">Volver</button>
          </div>
        </header>

        {feedback && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {feedback.text}
          </div>
        )}

        {role === 'member' && (
          <MyUpcomingBookings
            bookings={myBookings}
            loading={bookingsLoading}
            error={bookingsError}
            onRetry={refreshBookings}
            onCancel={handleCancelFromStrip}
          />
        )}

        <FiltersBar filters={filters} trainers={trainers} onChange={setFilters} />

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 mb-2">{error}</p>
            <button onClick={refresh} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Reintentar</button>
          </div>
        ) : (
          <WeeklyCalendar
            sessions={sessions}
            loading={loading}
            onBook={handleReserve}
            onCancel={handleCancel}
            onDetails={(session) => setSelectedSession(session)}
            actionLoading={bookingLoading || cancellingLoading}
          />
        )}

        {role === 'trainer' && (
          <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-dark-50 mb-4">Asistentes de mis clases</h2>

            {trainerLoading ? (
              <p className="text-sm text-dark-400">Cargando asistentes...</p>
            ) : trainerRows.length === 0 ? (
              <p className="text-sm text-dark-400">No tienes sesiones esta semana.</p>
            ) : (
              <div className="space-y-4">
                {trainerRows.map((row) => (
                  <div key={row.id} className="rounded-lg border border-dark-800 p-3">
                    <p className="text-sm font-semibold text-dark-100">{row.classes?.title}</p>
                    <p className="text-xs text-dark-400 mb-2">
                      {new Date(row.starts_at).toLocaleDateString('es-ES')} · {new Date(row.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    <div className="space-y-2">
                      {(row.class_bookings || []).filter((b: any) => b.status !== 'cancelled').map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between rounded-md bg-dark-950/60 border border-dark-800 px-3 py-2">
                          <div>
                            <p className="text-sm text-dark-100">
                              {booking.users?.name} {booking.users?.last_name}
                            </p>
                            <p className="text-xs text-dark-500">{booking.users?.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMarkAttendance(booking.id, 'attended')}
                              className="px-2 py-1 text-xs rounded bg-green-600/80 hover:bg-green-500 text-white"
                            >
                              Asistió
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(booking.id, 'no_show')}
                              className="px-2 py-1 text-xs rounded bg-yellow-600/80 hover:bg-yellow-500 text-white"
                            >
                              No show
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {role === 'admin' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form onSubmit={handleAdminCreateClass} className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-3">
              <h2 className="text-lg font-semibold text-dark-50">Admin · Crear clase</h2>
              <input value={adminClassForm.title} onChange={(e) => setAdminClassForm({ ...adminClassForm, title: e.target.value })} placeholder="Título" className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" required />
              <textarea value={adminClassForm.description} onChange={(e) => setAdminClassForm({ ...adminClassForm, description: e.target.value })} placeholder="Descripción" className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" rows={3} />
              <select value={adminClassForm.trainer_user_id} onChange={(e) => setAdminClassForm({ ...adminClassForm, trainer_user_id: e.target.value })} className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" required>
                <option value="">Selecciona entrenador</option>
                {trainers.map((t) => <option key={t.user_id} value={t.user_id}>{t.name} {t.last_name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <select value={adminClassForm.level} onChange={(e) => setAdminClassForm({ ...adminClassForm, level: e.target.value as any })} className="rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <input type="number" min={10} value={adminClassForm.duration_min} onChange={(e) => setAdminClassForm({ ...adminClassForm, duration_min: Number(e.target.value) })} placeholder="Duración" className="rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" />
                <input type="number" min={1} value={adminClassForm.capacity} onChange={(e) => setAdminClassForm({ ...adminClassForm, capacity: Number(e.target.value) })} placeholder="Capacidad" className="rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" />
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm">Crear clase</button>
            </form>

            <form onSubmit={handleAdminCreateSession} className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-3">
              <h2 className="text-lg font-semibold text-dark-50">Admin · Crear sesión</h2>
              <select value={adminSessionForm.class_id} onChange={(e) => setAdminSessionForm({ ...adminSessionForm, class_id: e.target.value })} className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" required>
                <option value="">Selecciona clase</option>
                {sessions.map((s) => <option key={s.class_id} value={s.class_id}>{s.classes.title}</option>)}
              </select>
              <input type="datetime-local" value={adminSessionForm.starts_at} onChange={(e) => setAdminSessionForm({ ...adminSessionForm, starts_at: e.target.value })} className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" required />
              <input type="datetime-local" value={adminSessionForm.ends_at} onChange={(e) => setAdminSessionForm({ ...adminSessionForm, ends_at: e.target.value })} className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" required />
              <input type="number" min={1} value={adminSessionForm.capacity_override} onChange={(e) => setAdminSessionForm({ ...adminSessionForm, capacity_override: e.target.value })} placeholder="Capacidad override (opcional)" className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm" />
              <button className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm">Crear sesión</button>
            </form>

            <div className="lg:col-span-2 bg-dark-900 border border-dark-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-dark-50 mb-3">Admin · Gestión rápida de clases</h2>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-lg border border-dark-800 bg-dark-950/60 px-3 py-2">
                    <div>
                      <p className="text-sm text-dark-100">{session.classes.title}</p>
                      <p className="text-xs text-dark-400">{new Date(session.starts_at).toLocaleDateString('es-ES')} · ocupación {session.bookedCount}/{session.capacity_override ?? session.classes.capacity}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await updateClass(session.class_id, { is_active: !session.classes.is_active });
                        await refresh();
                      }}
                      className="px-3 py-1.5 rounded-md bg-dark-800 hover:bg-dark-700 text-dark-100 text-xs"
                    >
                      {session.classes.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <ClassDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} />
    </div>
  );
};
