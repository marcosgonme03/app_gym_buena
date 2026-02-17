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
import { supabase } from '@/lib/supabase/client';

interface ReservationUser {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
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

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reservationUsers, setReservationUsers] = useState<ReservationUser[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  useEffect(() => {
    const loadReservationUsers = async () => {
      if (!selectedSession) {
        setReservationUsers([]);
        return;
      }

      const { data: bookingsRows, error: bookingsQueryError } = await supabase
        .from('class_bookings')
        .select('user_id,status')
        .eq('session_id', selectedSession.id)
        .in('status', ['confirmed', 'booked'])
        .limit(8);

      if (bookingsQueryError || !bookingsRows?.length) {
        setReservationUsers([]);
        return;
      }

      const userIds = bookingsRows.map((row) => row.user_id);
      const { data: usersRows, error: usersQueryError } = await supabase
        .from('users')
        .select('user_id,name,last_name,avatar_url')
        .in('user_id', userIds)
        .limit(8);

      if (usersQueryError || !usersRows?.length) {
        setReservationUsers([]);
        return;
      }

      setReservationUsers(
        usersRows.map((user) => ({
          userId: user.user_id,
          fullName: `${user.name} ${user.last_name}`.trim(),
          avatarUrl: user.avatar_url,
        }))
      );
    };

    loadReservationUsers();
  }, [selectedSession]);

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

  const syncError = classError || sessionsError || bookingsError;
  const showLoading = classLoading || sessionsLoading || bookingsLoading;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-28">
        <BottomNav />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="animate-pulse h-80 rounded-2xl bg-dark-800" />
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
          <div className={`rounded-lg border p-3 text-sm ${toast.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
            {toast.message}
          </div>
        )}

        <ClassHero item={classData} selectedSessionLabel={selectedSessionLabel} />

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
              cancellationPolicy="Cancela con al menos 2 horas de antelación para liberar plaza."
            />
          </div>

          <div className="space-y-4">
            <TrainerCard
              name={classData.users ? `${classData.users.name} ${classData.users.last_name}`.trim() : 'Entrenador del centro'}
              avatarUrl={classData.users?.avatar_url ?? null}
            />

            <ReservationAvatars
              users={reservationUsers}
              totalReserved={selectedReservedCount}
            />
          </div>
        </div>
      </main>

      <BookingCTA
        canReserve={canReserve}
        canCancel={canCancel}
        isFull={isSessionFull}
        isProcessing={bookingLoading || cancelLoading}
        onReserve={onReserve}
        onCancel={onCancel}
      />
    </div>
  );
};

export default ClassDetailsPage;
