import React, { useMemo } from 'react';
import { addWeeks, formatWeekRange } from '@/features/member/workoutPlan/weekHelpers';
import type { ClassesFilters, SessionWithAvailability } from '@/features/classes/types';
import { WeeklyCalendar } from '@/features/classes/components/WeeklyCalendar';

interface ReserveClassSectionProps {
  weekStart: string;
  sessions: SessionWithAvailability[];
  trainers: Array<{ user_id: string; name: string; last_name: string }>;
  filters: ClassesFilters;
  loading?: boolean;
  error?: string | null;
  actionLoading?: boolean;
  onWeekChange: (nextWeekStart: string) => void;
  onFiltersChange: (next: ClassesFilters) => void;
  onRetry: () => void;
  onBook: (session: SessionWithAvailability) => void;
  onCancel: (session: SessionWithAvailability) => void;
  onDetails: (session: SessionWithAvailability) => void;
}

export const ReserveClassSection: React.FC<ReserveClassSectionProps> = ({
  weekStart,
  sessions,
  trainers,
  filters,
  loading,
  error,
  actionLoading,
  onWeekChange,
  onFiltersChange,
  onRetry,
  onBook,
  onCancel,
  onDetails,
}) => {
  const classTypes = useMemo(() => {
    const unique = Array.from(new Set(sessions.map((session) => session.classes.title))).sort();
    return unique;
  }, [sessions]);

  return (
    <section className="bg-dark-900 border border-dark-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-dark-50">Reservar clase</h3>
          <p className="text-sm text-dark-400">Semana {formatWeekRange(weekStart)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeekChange(addWeeks(weekStart, -1))}
            className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
          >
            ← Semana anterior
          </button>
          <button
            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
            className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
          >
            Semana siguiente →
          </button>
        </div>
      </div>

      <div className="bg-dark-950/50 border border-dark-800 rounded-lg p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
          >
            <option value="">Tipo de clase (todas)</option>
            {classTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.trainerUserId}
            onChange={(e) => onFiltersChange({ ...filters, trainerUserId: e.target.value })}
            className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
          >
            <option value="all">Entrenador (todos)</option>
            {trainers.map((trainer) => (
              <option key={trainer.user_id} value={trainer.user_id}>
                {trainer.name} {trainer.last_name}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 text-sm text-dark-200 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700">
            <input
              type="checkbox"
              checked={filters.onlyAvailable}
              onChange={(e) => onFiltersChange({ ...filters, onlyAvailable: e.target.checked })}
            />
            Solo con plazas
          </label>

          <button
            onClick={() => onFiltersChange({ ...filters, search: '', trainerUserId: 'all', onlyAvailable: false })}
            className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300 mb-2">{error}</p>
          <button onClick={onRetry} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Reintentar</button>
        </div>
      ) : (
        <WeeklyCalendar
          sessions={sessions}
          loading={loading}
          onBook={onBook}
          onCancel={onCancel}
          onDetails={onDetails}
          actionLoading={actionLoading}
        />
      )}
    </section>
  );
};
