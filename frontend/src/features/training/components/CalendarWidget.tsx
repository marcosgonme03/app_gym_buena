// ============================================================================
// CalendarWidget — Calendario funcional con sesiones del mes
// ============================================================================

import React from 'react';
import type { CalendarDayData } from '../types';
import { MONTH_NAMES_ES } from '../hooks/useCalendar';

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const toISO = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function getStatusDot(sessions: CalendarDayData['sessions']): {
  color: string; label: string;
} | null {
  if (!sessions.length) return null;
  const statuses = sessions.map(s => s.status);
  if (statuses.includes('in_progress'))
    return { color: 'bg-amber-400',    label: 'En progreso' };
  if (statuses.includes('completed'))
    return { color: 'bg-primary-500',  label: 'Completado'  };
  if (statuses.includes('planned') || statuses.includes('not_started'))
    return { color: 'bg-blue-400/70',  label: 'Planificado' };
  return null;
}

interface CalendarWidgetProps {
  year:         number;
  month:        number;
  calDays:      (number | null)[];
  monthName?:   string;
  calendarData: Map<string, CalendarDayData>;
  selectedDate: string;
  loading:      boolean;
  onSelectDate: (iso: string) => void;
  onPrevMonth:  () => void;
  onNextMonth:  () => void;
  onGoToToday:  () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  year, month, calDays, calendarData, selectedDate,
  loading, onSelectDate, onPrevMonth, onNextMonth, onGoToToday,
}) => {
  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-dark-100 min-w-[130px] text-center">
            {MONTH_NAMES_ES[month]} {year}
          </span>
          <button
            onClick={onNextMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={onGoToToday}
          className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-primary-500/10"
        >
          Hoy
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-dark-800/50">
        {DAY_HEADERS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-bold text-dark-600 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      {loading ? (
        <div className="p-4 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-dark-800/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="p-2 grid grid-cols-7 gap-0.5">
          {calDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;

            const iso     = toISO(year, month, day);
            const data    = calendarData.get(iso);
            const dot     = data ? getStatusDot(data.sessions) : null;
            const isToday = iso === todayISO;
            const isSelected = iso === selectedDate;

            return (
              <button
                key={iso}
                onClick={() => onSelectDate(iso)}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5
                  text-sm font-medium transition-all duration-150
                  ${isSelected
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : isToday
                    ? 'bg-dark-800 text-primary-300 ring-1 ring-primary-500/40'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                  }
                `}
              >
                <span className="leading-none">{day}</span>
                {dot && (
                  <span
                    className={`w-1 h-1 rounded-full ${dot.color} ${isSelected ? 'opacity-80' : ''}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-3 pt-1 border-t border-dark-800/50 flex items-center gap-4">
        {[
          { color: 'bg-primary-500',  label: 'Completado'  },
          { color: 'bg-blue-400/70',  label: 'Planificado' },
          { color: 'bg-amber-400',    label: 'En progreso' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[10px] text-dark-600">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
