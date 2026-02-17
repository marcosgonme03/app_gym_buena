import React from 'react';
import type { ClassListItem } from '@/features/classes/hooks/useClasses';

interface RecommendedClassesProps {
  items: ClassListItem[];
  fallbackToPopular: boolean;
  onOpen: (slug: string) => void;
}

export const RecommendedClasses: React.FC<RecommendedClassesProps> = ({
  items,
  fallbackToPopular,
  onOpen,
}) => {
  if (!items.length) return null;

  return (
    <section className="bg-gradient-to-br from-primary-900/20 to-dark-900 border border-primary-700/30 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold text-dark-50">Recomendadas para ti</h2>
          <p className="text-xs text-dark-300">
            {fallbackToPopular ? 'Mostrando clases populares por falta de datos de preferencia.' : 'Basadas en tu nivel y reservas recientes.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const next = item.nextSessions[0];
          return (
            <button
              key={item.id}
              onClick={() => onOpen(item.slug)}
              className="text-left rounded-xl border border-dark-700 bg-dark-900/80 p-3 hover:border-primary-500/40 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
            >
              <p className="text-sm font-semibold text-dark-50 line-clamp-1">{item.title}</p>
              <p className="text-xs text-dark-300 mt-1 line-clamp-1">{item.trainerName}</p>
              {next ? (
                <p className="text-xs text-primary-200 mt-2">
                  {new Date(next.startsAt).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                  {' · '}
                  {new Date(next.startsAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : (
                <p className="text-xs text-dark-500 mt-2">Sin horario próximo</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
