import React from 'react';

export interface WeeklyProgressPoint {
  label: string;
  completed: number;
}

export interface WeeklyProgressData {
  weeklyGoal: number;
  completedTotal: number;
  points: WeeklyProgressPoint[];
}

interface WeeklyProgressCardProps {
  data: WeeklyProgressData;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const WeeklyProgressCard: React.FC<WeeklyProgressCardProps> = ({ data, loading, error, onRetry }) => {
  if (loading) {
    return (
      <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-dark-800 rounded" />
          <div className="h-14 bg-dark-800 rounded" />
          <div className="h-32 bg-dark-800 rounded" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dark-50 mb-3">Progreso semanal</h2>
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 transition-colors"
        >
          Reintentar
        </button>
      </section>
    );
  }

  const safeGoal = data.weeklyGoal > 0 ? data.weeklyGoal : 1;
  const percentage = Math.min(100, Math.round((data.completedTotal / safeGoal) * 100));
  const maxValue = Math.max(...data.points.map((point) => point.completed), 1);
  const remaining = Math.max(0, data.weeklyGoal - data.completedTotal);

  return (
    <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900">
          Progreso semanal
        </h2>
        <span className="text-xs text-dark-400">{percentage}%</span>
      </div>

      <div className="mb-5 p-3 rounded-lg border border-dark-800 bg-dark-950/60">
        <p className="text-sm text-dark-300">
          <span className="font-semibold text-dark-50">{data.completedTotal}</span> / {data.weeklyGoal} objetivo semanal
        </p>
        <p className="text-xs text-dark-400 mt-1">
          {remaining === 0 ? 'Vas bien, objetivo cumplido' : `Te faltan ${remaining}`}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2 items-end h-44">
        {data.points.map((point) => {
          const barHeight = `${Math.max(8, Math.round((point.completed / maxValue) * 100))}%`;
          return (
            <div key={point.label} className="h-full flex flex-col justify-end items-center gap-2">
              <span className="text-[10px] text-dark-400">{point.completed}</span>
              <div className="w-full h-full max-h-32 bg-dark-800/70 rounded-md flex items-end p-1">
                <div
                  className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-sm"
                  style={{ height: barHeight }}
                />
              </div>
              <span className="text-xs text-dark-400">{point.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
