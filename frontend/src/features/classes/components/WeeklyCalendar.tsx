import React from 'react';
import type { SessionWithAvailability } from '@/features/classes/types';
import { ClassSessionCard } from '@/features/classes/components/ClassSessionCard';

interface WeeklyCalendarProps {
  sessions: SessionWithAvailability[];
  loading?: boolean;
  onBook: (session: SessionWithAvailability) => void;
  onCancel: (session: SessionWithAvailability) => void;
  onDetails: (session: SessionWithAvailability) => void;
  actionLoading?: boolean;
}

const dayConfig = [
  { key: 1, short: 'L', label: 'Lunes' },
  { key: 2, short: 'M', label: 'Martes' },
  { key: 3, short: 'X', label: 'Miércoles' },
  { key: 4, short: 'J', label: 'Jueves' },
  { key: 5, short: 'V', label: 'Viernes' },
  { key: 6, short: 'S', label: 'Sábado' },
  { key: 0, short: 'D', label: 'Domingo' },
];

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  sessions,
  loading,
  onBook,
  onCancel,
  onDetails,
  actionLoading,
}) => {
  const sessionsByDay = dayConfig.map((day) => ({
    ...day,
    sessions: sessions.filter((session) => new Date(session.starts_at).getDay() === day.key),
  }));

  if (loading) {
    return (
      <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-lg bg-dark-800" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="md:hidden space-y-3">
        {sessionsByDay.map((day) => (
          <div key={day.key} className="bg-dark-900 border border-dark-800 rounded-xl p-3">
            <h4 className="text-sm font-semibold text-dark-100 mb-2">{day.label}</h4>
            {day.sessions.length === 0 ? (
              <p className="text-xs text-dark-500">Sin clases</p>
            ) : (
              <div className="space-y-2">
                {day.sessions.map((session) => (
                  <ClassSessionCard
                    key={session.id}
                    session={session}
                    actionLoading={actionLoading}
                    onBook={onBook}
                    onCancel={onCancel}
                    onDetails={onDetails}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:grid lg:hidden grid-cols-2 gap-3">
        {sessionsByDay.map((day) => (
          <div key={day.key} className="bg-dark-900 border border-dark-800 rounded-xl p-3">
            <h4 className="text-sm font-semibold text-dark-100 mb-2">{day.label}</h4>
            {day.sessions.length === 0 ? (
              <p className="text-xs text-dark-500">Sin clases</p>
            ) : (
              <div className="space-y-2">
                {day.sessions.map((session) => (
                  <ClassSessionCard
                    key={session.id}
                    session={session}
                    actionLoading={actionLoading}
                    onBook={onBook}
                    onCancel={onCancel}
                    onDetails={onDetails}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden lg:grid grid-cols-7 gap-3">
        {sessionsByDay.map((day) => (
          <div key={day.key} className="bg-dark-900 border border-dark-800 rounded-xl p-3 min-h-[260px]">
            <h4 className="text-sm font-semibold text-dark-100 mb-2">{day.short}</h4>
            <p className="text-[11px] text-dark-500 mb-3">{day.label}</p>
            {day.sessions.length === 0 ? (
              <p className="text-xs text-dark-500">Sin clases</p>
            ) : (
              <div className="space-y-2">
                {day.sessions.map((session) => (
                  <ClassSessionCard
                    key={session.id}
                    session={session}
                    actionLoading={actionLoading}
                    onBook={onBook}
                    onCancel={onCancel}
                    onDetails={onDetails}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
