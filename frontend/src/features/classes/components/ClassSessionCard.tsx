import React from 'react';
import type { SessionWithAvailability } from '@/features/classes/types';

interface ClassSessionCardProps {
  session: SessionWithAvailability;
  actionLoading?: boolean;
  onBook: (session: SessionWithAvailability) => void;
  onCancel: (session: SessionWithAvailability) => void;
  onDetails: (session: SessionWithAvailability) => void;
}

const stateBadge: Record<SessionWithAvailability['availabilityState'], string> = {
  available: 'bg-green-500/15 text-green-300 border-green-500/30',
  few_left: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  full: 'bg-red-500/15 text-red-300 border-red-500/30',
  booked: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  cancelled: 'bg-dark-700 text-dark-300 border-dark-600',
};

const stateLabel: Record<SessionWithAvailability['availabilityState'], string> = {
  available: 'Disponible',
  few_left: 'Últimas plazas',
  full: 'Completa',
  booked: 'Ya reservada',
  cancelled: 'Cancelada',
};

export const ClassSessionCard: React.FC<ClassSessionCardProps> = ({
  session,
  actionLoading,
  onBook,
  onCancel,
  onDetails,
}) => {
  const starts = new Date(session.starts_at);
  const ends = new Date(session.ends_at);

  const canBook = session.availabilityState === 'available' || session.availabilityState === 'few_left';
  const canCancel = session.availabilityState === 'booked';

  return (
    <article className="bg-dark-900 border border-dark-800 rounded-xl p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-dark-50">{session.classes.title}</h4>
          <p className="text-xs text-dark-400 mt-1">
            {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {ends.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] border ${stateBadge[session.availabilityState]}`}>
          {stateLabel[session.availabilityState]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="rounded-md bg-dark-950/70 border border-dark-800 p-2">
          <p className="text-dark-500">Nivel</p>
          <p className="text-dark-200 mt-1">{session.classes.level || 'Todos'}</p>
        </div>
        <div className="rounded-md bg-dark-950/70 border border-dark-800 p-2">
          <p className="text-dark-500">Duración</p>
          <p className="text-dark-200 mt-1">{session.classes.duration_min} min</p>
        </div>
      </div>

      <p className="text-xs text-dark-400 mb-4">
        {session.bookedCount} / {session.capacity_override ?? session.classes.capacity} ocupadas · {session.remainingSpots} libres
      </p>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => onDetails(session)}
          className="flex-1 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm transition-colors"
        >
          Detalle
        </button>

        {canBook && (
          <button
            disabled={actionLoading}
            onClick={() => onBook(session)}
            className="flex-1 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm transition-colors disabled:opacity-60"
          >
            Reservar
          </button>
        )}

        {canCancel && (
          <button
            disabled={actionLoading}
            onClick={() => onCancel(session)}
            className="flex-1 px-3 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-sm transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        {!canBook && !canCancel && session.availabilityState !== 'cancelled' && (
          <button disabled className="flex-1 px-3 py-2 rounded-lg bg-dark-700 text-dark-400 text-sm cursor-not-allowed">
            Sin plazas
          </button>
        )}
      </div>
    </article>
  );
};
