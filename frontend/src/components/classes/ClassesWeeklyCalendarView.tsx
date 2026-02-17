import React from 'react';
import type { CalendarClassItem } from '@/features/classes/hooks/useClassesExtended';

interface ClassesWeeklyCalendarViewProps {
  itemsByDay: Record<number, CalendarClassItem[]>;
  onOpen: (slug: string) => void;
}

const days = [
  { key: 1, short: 'L', label: 'Lunes' },
  { key: 2, short: 'M', label: 'Martes' },
  { key: 3, short: 'X', label: 'Miércoles' },
  { key: 4, short: 'J', label: 'Jueves' },
  { key: 5, short: 'V', label: 'Viernes' },
  { key: 6, short: 'S', label: 'Sábado' },
  { key: 0, short: 'D', label: 'Domingo' },
];

export const ClassesWeeklyCalendarView: React.FC<ClassesWeeklyCalendarViewProps> = ({ itemsByDay, onOpen }) => {
  return (
    <section className="space-y-3">
      <div className="md:hidden space-y-3">
        {days.map((day) => (
          <div key={day.key} className="rounded-xl border border-dark-800 bg-dark-900 p-3">
            <h4 className="text-sm font-semibold text-dark-100 mb-2">{day.label}</h4>
            {(itemsByDay[day.key] || []).length === 0 ? (
              <p className="text-xs text-dark-500">Sin clases</p>
            ) : (
              <div className="space-y-2">
                {(itemsByDay[day.key] || []).slice(0, 6).map((item) => (
                  <button
                    key={item.sessionId}
                    onClick={() => onOpen(item.slug)}
                    className="w-full text-left rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 hover:border-primary-500/40 transition-colors"
                  >
                    <p className="text-xs font-semibold text-dark-100 line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-dark-400 mt-0.5">{item.trainerName}</p>
                    <p className="text-[11px] text-primary-200 mt-1">
                      {new Date(item.startsAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {item.remainingSpots}/{item.totalSpots} plazas
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day) => (
          <div key={day.key} className="rounded-xl border border-dark-800 bg-dark-900 p-3 min-h-[240px]">
            <h4 className="text-sm font-semibold text-dark-100">{day.short}</h4>
            <p className="text-[11px] text-dark-500 mb-2">{day.label}</p>
            {(itemsByDay[day.key] || []).length === 0 ? (
              <p className="text-xs text-dark-500">Sin clases</p>
            ) : (
              <div className="space-y-2">
                {(itemsByDay[day.key] || []).slice(0, 5).map((item) => (
                  <button
                    key={item.sessionId}
                    onClick={() => onOpen(item.slug)}
                    className="w-full text-left rounded-md border border-dark-700 bg-dark-800 px-2 py-1.5 hover:border-primary-500/40 transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-dark-100 line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-primary-200 mt-0.5">
                      {new Date(item.startsAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
