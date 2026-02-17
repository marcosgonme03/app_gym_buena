import React from 'react';
import type { ClassListItem } from '@/features/classes/hooks/useClasses';

interface ClassCardProps {
  item: ClassListItem;
  onOpen: (slug: string) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ item, onOpen }) => {
  const cover = item.cover_image_url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80';

  return (
    <button
      onClick={() => onOpen(item.slug)}
      className="group text-left rounded-2xl overflow-hidden border border-dark-800 bg-dark-900 hover:border-primary-500/50 transition-colors"
      aria-label={`Abrir detalle de ${item.title}`}
    >
      <div className="relative h-52">
        <img
          src={cover}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="text-xs text-gray-200 mt-1">Con {item.trainerName}</p>
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
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
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
                    <span className={session.remainingSpots > 0 ? 'text-green-300' : 'text-red-300'}>
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
      </div>
    </button>
  );
};
