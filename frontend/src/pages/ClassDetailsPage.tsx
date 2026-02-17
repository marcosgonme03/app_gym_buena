import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { ClassHero } from '@/components/classes/ClassHero';
import { TrainerCard } from '@/components/classes/TrainerCard';
import { ReservationAvatars } from '@/components/classes/ReservationAvatars';
import { CollapsibleInfo } from '@/components/classes/CollapsibleInfo';
import { BookingCTA } from '@/components/classes/BookingCTA';
import { SessionPicker, type SessionPickerItem } from '@/components/classes/SessionPicker';
import { useClassBySlug } from '@/features/classes/hooks/useClassBySlug';
import { useClassSessions } from '@/features/classes/hooks/useClassSessions';
import { useMyBookingsForClass } from '@/features/classes/hooks/useMyBookingsForClass';
import { useBookSession } from '@/features/classes/hooks/useBookSession';
import { useCancelBooking } from '@/features/classes/hooks/useCancelBooking';
import { useClassDetailExtended } from '@/features/classes/hooks/useClassDetailExtended';
import { useUserClassStats } from '@/features/classes/hooks/useUserClassStats';
import { fetchClassSessionParticipants } from '@/features/classes/services/classesService';
import { supabase } from '@/lib/supabase/client';

interface ReservationUser {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
}

const REMINDER_KEY = 'class-reminders-2h';

function toCountdownLabel(startsAt?: string) {
  if (!startsAt) return null;
  const starts = new Date(startsAt);
  const now = new Date();
  if (starts.toDateString() !== now.toDateString()) return null;

  const diffMs = starts.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `Empieza en ${minutes}m`;
  return `Empieza en ${hours}h ${minutes}m`;
}

function downloadSessionIcs(title: string, startsAt: string, endsAt: string, description?: string | null) {
  const toIcsDate = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}Z`;

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GymFlow//Class Booking//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@gymflow`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(new Date(startsAt))}`,
    `DTEND:${toIcsDate(new Date(endsAt))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description || 'Clase reservada en GymFlow').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ClassDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: classData, loading: classLoading, error: classError, refresh: refreshClass } = useClassBySlug(slug);

  const range = useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, []);

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
  } = useMyBookingsForClass(classData?.id, 20);

  const { mutate: reserve, loading: bookingLoading } = useBookSession();
  const { mutate: cancel, loading: cancelLoading } = useCancelBooking();
  const { data: extendedDetail } = useClassDetailExtended(classData);
  const { data: userClassStats } = useUserClassStats(classData?.id);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reservationUsers, setReservationUsers] = useState<ReservationUser[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    if (!selectedSessionId) {
      setReminderEnabled(false);
      return;
    }

    const raw = window.localStorage.getItem(REMINDER_KEY);
    const ids = raw ? raw.split(',').filter(Boolean) : [];
    setReminderEnabled(ids.includes(selectedSessionId));
  }, [selectedSessionId]);

  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId(null);
      return;
    }

    const firstSelectable = sessions.find((session) => !session.is_cancelled && new Date(session.ends_at) > new Date()) ?? sessions[0];
    setSelectedSessionId(firstSelectable.id);
  }, [sessions]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((item) => item.id === selectedSessionId) ?? null;
  }, [sessions, selectedSessionId]);

  const sessionItems = useMemo<SessionPickerItem[]>(() => {
    const mySessionIds = new Set(
      myBookings
        .filter((booking) => booking.status === 'booked' || booking.status === 'confirmed')
        .map((booking) => booking.session_id)
    );

    return sessions.map((session) => {
      const totalSpots = session.capacity_override ?? session.classes.capacity;
      return {
        id: session.id,
        startsAt: session.starts_at,
        endsAt: session.ends_at,
        remainingSpots: session.remainingSpots,
        totalSpots,
        isCancelled: session.is_cancelled,
        isBookedByMe: mySessionIds.has(session.id),
      };
    });
  }, [sessions, myBookings]);

  const selectedSessionLabel = useMemo(() => {
    if (!selectedSession) return 'Selecciona un horario disponible';
    const starts = new Date(selectedSession.starts_at);
    const ends = new Date(selectedSession.ends_at);

    return `${starts.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })} · ${starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${ends.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }, [selectedSession]);

  const countdownText = useMemo(() => toCountdownLabel(selectedSession?.starts_at), [selectedSession?.starts_at]);

  useEffect(() => {
    const loadReservationUsers = async () => {
      if (!selectedSession) {
        setReservationUsers([]);
        return;
      }

      try {
        const participants = await fetchClassSessionParticipants(selectedSession.id, 8);
        if (!participants.length) {
          setReservationUsers([]);
          return;
        }

        setReservationUsers(
          participants.map((participant) => ({
            userId: participant.user_id,
            fullName: participant.full_name || 'Usuario',
            avatarUrl: participant.avatar_url,
          }))
        );
      } catch {
        setReservationUsers([]);
      }
    };

    loadReservationUsers();
  }, [selectedSession]);

  useEffect(() => {
    if (!classData?.id) return;

    const channel = supabase
      .channel(`class-live-${classData.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_bookings' },
        async () => {
          await Promise.all([refreshSessions(), refreshBookings()]);
        }
      )
      .subscribe();

    const intervalId = window.setInterval(async () => {
      await Promise.all([refreshSessions(), refreshBookings()]);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
      channel.unsubscribe();
    };
  }, [classData?.id, refreshSessions, refreshBookings]);

  const isBookedByMe = useMemo(() => {
    if (!selectedSession) return false;

    return myBookings.some(
      (booking) =>
        booking.session_id === selectedSession.id &&
        (booking.status === 'booked' || booking.status === 'confirmed')
    );
  }, [myBookings, selectedSession]);

  const isSessionPast = selectedSession ? new Date(selectedSession.ends_at) <= new Date() : false;
  const isSessionFull = selectedSession ? selectedSession.remainingSpots <= 0 && !isBookedByMe : false;
  const canReserve = Boolean(selectedSession && !isSessionPast && !selectedSession.is_cancelled && !isSessionFull && !isBookedByMe);
  const canCancel = Boolean(selectedSession && !isSessionPast && isBookedByMe);

  const selectedReservedCount = selectedSession?.bookedCount ?? 0;
  const selectedTotalSpots = selectedSession ? (selectedSession.capacity_override ?? selectedSession.classes.capacity) : 0;
  const selectedRemainingSpots = selectedSession?.remainingSpots ?? 0;

  const occupancyStyle = useMemo(() => {
    if (!selectedSession || selectedTotalSpots <= 0) return { width: '0%', bar: 'bg-dark-700', badge: null as string | null };
    const freeRatio = selectedRemainingSpots / selectedTotalSpots;
    const occupiedPercent = Math.round(((selectedTotalSpots - selectedRemainingSpots) / selectedTotalSpots) * 100);

    if (selectedRemainingSpots <= 0 || freeRatio <= 0.1) return { width: `${occupiedPercent}%`, bar: 'bg-red-500', badge: selectedRemainingSpots <= 0 ? 'Completa' : '🔥 Últimas plazas' };
    if (freeRatio < 0.3) return { width: `${occupiedPercent}%`, bar: 'bg-yellow-500', badge: '🔥 Últimas plazas' };
    return { width: `${occupiedPercent}%`, bar: 'bg-green-500', badge: null };
  }, [selectedRemainingSpots, selectedSession, selectedTotalSpots]);

  const onReserve = async () => {
    if (!selectedSession) return;

    try {
      await reserve(selectedSession.id);
      setToast({ type: 'success', message: 'Reserva confirmada.' });
      await Promise.all([refreshSessions(), refreshBookings()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo completar la reserva';
      setToast({ type: 'error', message });
    }
  };

  const onCancel = async () => {
    if (!selectedSession) return;

    try {
      await cancel(selectedSession.id);
      setToast({ type: 'success', message: 'Reserva cancelada correctamente.' });
      await Promise.all([refreshSessions(), refreshBookings()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cancelar la reserva';
      setToast({ type: 'error', message });
    }
  };

  const onJoinWaitlist = () => {
    setToast({ type: 'info', message: 'Te hemos añadido a la lista de espera de esta sesión.' });
  };

  const onAddCalendar = () => {
    if (!selectedSession || !classData) return;
    downloadSessionIcs(classData.title, selectedSession.starts_at, selectedSession.ends_at, classData.description);
    setToast({ type: 'success', message: 'Evento descargado (.ics).' });
  };

  const onToggleReminder = () => {
    if (!selectedSessionId) return;
    const raw = window.localStorage.getItem(REMINDER_KEY);
    const ids = raw ? raw.split(',').filter(Boolean) : [];

    let next: string[];
    if (ids.includes(selectedSessionId)) {
      next = ids.filter((id) => id !== selectedSessionId);
      setReminderEnabled(false);
      setToast({ type: 'info', message: 'Recordatorio desactivado para esta sesión.' });
    } else {
      next = [...ids, selectedSessionId];
      setReminderEnabled(true);
      setToast({ type: 'success', message: 'Te recordaremos esta clase 2h antes.' });
    }

    window.localStorage.setItem(REMINDER_KEY, next.join(','));
  };

  const syncError = classError || sessionsError || bookingsError;
  const showLoading = classLoading || sessionsLoading || bookingsLoading;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-28">
        <BottomNav />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="animate-pulse rounded-2xl border border-dark-800 bg-dark-900 overflow-hidden">
            <div className="h-72 bg-dark-800" />
            <div className="p-4 space-y-3">
              <div className="h-5 rounded bg-dark-800 w-1/2" />
              <div className="h-3 rounded bg-dark-800 w-2/3" />
              <div className="h-10 rounded bg-dark-800 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (syncError || !classData) {
    return (
      <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24">
        <BottomNav />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <p className="text-sm text-red-300">{syncError || 'No se pudo cargar el detalle de la clase.'}</p>
            <button
              onClick={() => {
                refreshClass();
                refreshSessions();
                refreshBookings();
              }}
              className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-28">
      <BottomNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-5 space-y-4">
        <button
          onClick={() => navigate('/app/classes')}
          className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
        >
          ← Volver a clases
        </button>

        {toast && (
          <div className={`rounded-lg border p-3 text-sm transition-all duration-300 ${toast.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-200' : toast.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-blue-500/30 bg-blue-500/10 text-blue-200'}`}>
            {toast.message}
          </div>
        )}

        <ClassHero item={classData} selectedSessionLabel={selectedSessionLabel} />

        <section className="rounded-xl border border-dark-800 bg-dark-900 p-4 transition-all duration-300" key={selectedSession?.id || 'no-session'}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-dark-100">Ocupación de la sesión</p>
            {occupancyStyle.badge && (
              <span className="px-2 py-0.5 rounded-full text-[11px] border border-red-500/40 bg-red-500/10 text-red-200">
                {occupancyStyle.badge}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-dark-300 mb-1.5">
            <span>{selectedTotalSpots - selectedRemainingSpots}/{selectedTotalSpots} ocupadas</span>
            <span>{selectedRemainingSpots} libres</span>
          </div>
          <div className="h-2 rounded-full bg-dark-800 overflow-hidden">
            <div className={`h-full ${occupancyStyle.bar} transition-all duration-500`} style={{ width: occupancyStyle.width }} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SessionPicker
              sessions={sessionItems}
              selectedSessionId={selectedSessionId}
              onSelectSession={setSelectedSessionId}
            />

            <CollapsibleInfo
              objective={`Mejorar tu rendimiento en ${classData.title.toLowerCase()} con técnica segura y progresión sostenible.`}
              material="Toalla, botella de agua y ropa técnica transpirable."
              intensity={classData.level === 'advanced' ? 'Alta' : classData.level === 'intermediate' ? 'Media' : 'Moderada'}
              requirements="Apto para personas sanas; adapta cargas si vuelves de lesión."
              cancellationPolicy={extendedDetail.cancellationPolicy}
              classSummary={classData.description}
              classPlan={extendedDetail.classPlan}
            />

            <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
              <h3 className="text-sm font-semibold text-dark-100 mb-2">Tu historial en esta clase</h3>
              <p className="text-sm text-dark-300">Has asistido {userClassStats.attendedCount} veces</p>
              <p className="text-xs text-dark-400 mt-1">
                {userClassStats.lastAttendedAt
                  ? `Última vez: ${new Date(userClassStats.lastAttendedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
                  : 'Aún no hay asistencia registrada en esta clase.'}
              </p>
            </section>
          </div>

          <div className="space-y-4">
            <TrainerCard
              name={classData.users ? `${classData.users.name} ${classData.users.last_name}`.trim() : 'Entrenador del centro'}
              avatarUrl={classData.users?.avatar_url ?? null}
              specialty={extendedDetail.trainer.specialty}
              classesCount={extendedDetail.trainer.classesCount}
              rating={extendedDetail.trainer.rating}
              onViewProfile={() => setToast({ type: 'info', message: 'Perfil de entrenador disponible próximamente.' })}
            />

            <ReservationAvatars
              users={reservationUsers}
              totalReserved={selectedReservedCount}
              demandLabel={extendedDetail.demandLabel}
            />

            <section className="rounded-xl border border-dark-800 bg-dark-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dark-100">Funciones premium</h3>
              <button
                onClick={onAddCalendar}
                disabled={!selectedSession}
                className="w-full px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm transition-colors disabled:opacity-60"
                aria-label="Añadir al calendario"
              >
                Añadir al calendario (.ics)
              </button>

              <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-dark-700 bg-dark-950/60">
                <span className="text-sm text-dark-200">Recordarme 2h antes</span>
                <button
                  type="button"
                  onClick={onToggleReminder}
                  className={`w-11 h-6 rounded-full transition-colors ${reminderEnabled ? 'bg-primary-500' : 'bg-dark-700'}`}
                  aria-label="Activar o desactivar recordatorio"
                >
                  <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${reminderEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>

              <div className="rounded-lg border border-dark-700 bg-dark-950/60 p-3">
                <p className="text-xs text-dark-300">Política de cancelación</p>
                <p className="text-sm text-dark-200 mt-1">{extendedDetail.cancellationPolicy}</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <BookingCTA
        canReserve={canReserve}
        canCancel={canCancel}
        isFull={isSessionFull}
        isProcessing={bookingLoading || cancelLoading}
        remainingSpots={selectedRemainingSpots}
        totalSpots={selectedTotalSpots}
        countdownText={countdownText}
        canJoinWaitlist={Boolean(selectedSession && isSessionFull && !isBookedByMe)}
        onReserve={onReserve}
        onCancel={onCancel}
        onJoinWaitlist={onJoinWaitlist}
      />
    </div>
  );
};

export default ClassDetailsPage;
