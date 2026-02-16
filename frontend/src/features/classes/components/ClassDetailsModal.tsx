import React from 'react';
import type { SessionWithAvailability } from '@/features/classes/types';

interface ClassDetailsModalProps {
  session: SessionWithAvailability | null;
  onClose: () => void;
}

export const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  const starts = new Date(session.starts_at);
  const ends = new Date(session.ends_at);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-dark-900 border border-dark-800 rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-dark-50">{session.classes.title}</h3>
            <p className="text-sm text-dark-400 mt-1">
              {starts.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' })}
              {' · '}
              {starts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {ends.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="text-dark-300 hover:text-dark-100">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
            <p className="text-xs text-dark-400">Nivel</p>
            <p className="text-sm text-dark-100 mt-1">{session.classes.level || 'Todos'}</p>
          </div>
          <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
            <p className="text-xs text-dark-400">Duración</p>
            <p className="text-sm text-dark-100 mt-1">{session.classes.duration_min} min</p>
          </div>
          <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
            <p className="text-xs text-dark-400">Capacidad</p>
            <p className="text-sm text-dark-100 mt-1">{session.capacity_override ?? session.classes.capacity}</p>
          </div>
          <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
            <p className="text-xs text-dark-400">Disponibilidad</p>
            <p className="text-sm text-dark-100 mt-1">{session.remainingSpots} plazas</p>
          </div>
        </div>

        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-4">
          <p className="text-xs text-dark-400 mb-2">Descripción</p>
          <p className="text-sm text-dark-200">{session.classes.description || 'Sin descripción adicional.'}</p>
        </div>

        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-4 mt-3">
          <p className="text-xs text-dark-400 mb-2">Material recomendado</p>
          <p className="text-sm text-dark-200">Botella de agua, toalla y ropa deportiva cómoda.</p>
        </div>

        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-4 mt-3">
          <p className="text-xs text-dark-400 mb-2">Política de cancelación</p>
          <p className="text-sm text-dark-200">Cancela con al menos 2h de antelación para liberar la plaza.</p>
        </div>
      </div>
    </div>
  );
};
