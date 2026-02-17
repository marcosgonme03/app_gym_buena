import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ClassListItem } from '@/features/classes/hooks/useClasses';
import type { ClassDemandSignal } from '@/features/classes/services/classesService';

interface ClassCardProps {
  item: ClassListItem;
  onOpen: (slug: string) => void;
  demandSignal?: ClassDemandSignal;
  onCancelBooking?: (sessionId: string) => void;
  actionLoadingSessionId?: string | null;
}

const formatCountdown = (minutes: number | null) => {
  if (minutes === null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `Empieza en ${m}m`;
  return `Empieza en ${h}h ${m}m`;
};

export const ClassCard: React.FC<ClassCardProps> = ({
  item,
  onOpen,
  demandSignal,
  onCancelBooking,
  actionLoadingSessionId,
}) => {
  const cover = item.cover_image_url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80';
  const videoUrl = item.video_url || null;
  const [videoPreview, setVideoPreview] = useState(false);
  const previewTimeoutRef = useRef<number | null>(null);

  const firstSession = item.nextSessions.find((session) => !session.isCancelled) || item.nextSessions[0] || null;
  const bookedSession = item.nextMySession;
  const hasBooking = item.hasMyBooking;

  const availability = useMemo(() => {
    if (!firstSession) return { color: 'bg-dark-700', text: 'text-dark-300', badge: 'Nueva' as const };

    const freeRatio = firstSession.totalSpots > 0 ? firstSession.remainingSpots / firstSession.totalSpots : 0;
    if (firstSession.remainingSpots <= 0) return { color: 'bg-red-500', text: 'text-red-200', badge: 'Completa' as const };
    if (firstSession.remainingSpots <= 2 || freeRatio <= 0.2) return { color: 'bg-red-500', text: 'text-red-200', badge: '🔥 Últimas plazas' as const };
    if (freeRatio < 0.3) return { color: 'bg-yellow-500', text: 'text-yellow-200', badge: '🔥 Últimas plazas' as const };
    if (freeRatio > 0.4) return { color: 'bg-green-500', text: 'text-green-200', badge: 'Nueva' as const };
    return { color: 'bg-yellow-500', text: 'text-yellow-200', badge: 'Nueva' as const };
  }, [firstSession]);

  const countdownText = formatCountdown(
    bookedSession?.startsToday ? bookedSession.startsInMinutes : null
  );

  const handleMouseEnter = () => {
    if (!videoUrl) return;
    setVideoPreview(true);
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }
    previewTimeoutRef.current = window.setTimeout(() => {
      setVideoPreview(false);
    }, 4000);
  };

  const handleMouseLeave = () => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }
    setVideoPreview(false);
  };

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      onClick={() => onOpen(item.slug)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group text-left rounded-2xl overflow-hidden border border-dark-800 bg-dark-900 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-900/20 hover:scale-[1.01] transition-all duration-300"
      aria-label={`Abrir detalle de ${item.title}`}
    >
      <div className="relative h-52">
        {videoPreview && videoUrl ? (
          <video
            src={videoUrl}
            muted
            autoPlay
            playsInline
            loop
            preload="metadata"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            aria-label={`Preview de ${item.title}`}
          />
        ) : (
          <img
            src={cover}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white drop-shadow-sm">{item.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border border-white/20 bg-black/40 ${availability.text}`}>
              {availability.badge}
            </span>
          </div>
          <p className="text-xs text-gray-100 mt-1">Con {item.trainerName}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] border bg-primary-500/15 text-primary-200 border-primary-500/30">
              {item.level || 'Todos los niveles'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] border bg-dark-800/70 text-dark-200 border-dark-600">
              {item.duration_min} min
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] border bg-dark-800/70 text-dark-200 border-dark-600">
              Capacidad {item.capacity}
            </span>
            {hasBooking && (
              <span className="px-2 py-0.5 rounded-full text-[10px] border bg-green-500/15 text-green-200 border-green-500/40">
                Reservada
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {firstSession && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-dark-300">
              <span>Ocupación</span>
              <span>{firstSession.bookedSpots}/{firstSession.totalSpots}</span>
            </div>
            <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${availability.color} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, firstSession.occupancyRatio * 100))}%` }}
              />
            </div>
          </div>
        )}

        {demandSignal && demandSignal.label !== 'Estable' && (
          <p className="text-xs text-primary-200">{demandSignal.label}</p>
        )}

        {countdownText && (
          <p className="text-xs text-green-200 font-medium">{countdownText}</p>
        )}

        {item.nextSessions.length > 0 ? (
          <>
            <p className="text-xs uppercase tracking-wide text-dark-400">Próximos horarios</p>
            <div className="space-y-1">
              {item.nextSessions.map((session) => {
                const starts = new Date(session.startsAt);
                return (
                  <div key={session.id} className="flex items-center justify-between text-xs text-dark-200">
                    <span>
                      {starts.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                      {' · '}
                      {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={session.remainingSpots > 0 ? 'text-green-300 font-medium' : 'text-red-300 font-medium'}>
                      {session.remainingSpots}/{session.totalSpots}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-dark-400">Sin horarios próximos publicados</p>
        )}

        {bookedSession && onCancelBooking && (
          <div className="pt-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCancelBooking(bookedSession.id);
              }}
              aria-label={`Cancelar reserva de ${item.title}`}
              className="w-full px-3 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-xs font-medium hover:bg-red-500/20 transition-colors"
            >
              {actionLoadingSessionId === bookedSession.id ? 'Cancelando...' : 'Cancelar reserva'}
            </button>
          </div>
        )}
      </div>
    </button>
  );
};
