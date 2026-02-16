import React from 'react';

export type TrainingStatus = 'not_started' | 'in_progress' | 'completed';

export interface TodayExercise {
  id: string;
  name: string;
}

export interface TodayTrainingData {
  status: TrainingStatus;
  type: string;
  estimatedDurationMin: number;
  exerciseCount: number;
  exercises: TodayExercise[];
  hasPlannedWorkout: boolean;
  lastUpdatedLabel: string;
}

interface TodayTrainingCardProps {
  data: TodayTrainingData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

const statusLabel: Record<TrainingStatus, string> = {
  not_started: 'No iniciado',
  in_progress: 'En progreso',
  completed: 'Completado'
};

const statusStyle: Record<TrainingStatus, string> = {
  not_started: 'bg-dark-800 text-dark-300 border-dark-700',
  in_progress: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  completed: 'bg-green-500/15 text-green-300 border-green-500/30'
};

const ctaLabel: Record<TrainingStatus, string> = {
  not_started: 'Comenzar entrenamiento',
  in_progress: 'Continuar',
  completed: 'Ver resumen'
};

export const TodayTrainingCard: React.FC<TodayTrainingCardProps> = ({
  data,
  loading,
  error,
  onRetry,
  onPrimaryAction,
  onSecondaryAction,
}) => {
  if (loading) {
    return (
      <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-dark-800 rounded" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-dark-800 rounded" />
            <div className="h-16 bg-dark-800 rounded" />
            <div className="h-16 bg-dark-800 rounded" />
          </div>
          <div className="h-24 bg-dark-800 rounded" />
          <div className="h-10 bg-dark-800 rounded" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dark-50 mb-3">Entrenamiento de Hoy</h2>
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

  if (!data) return null;

  if (!data.hasPlannedWorkout) {
    return (
      <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900 mb-3">
          Entrenamiento de Hoy
        </h2>
        <p className="text-sm text-dark-300 mb-5">No tienes entrenamiento asignado hoy</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
          >
            Crear planificación
          </button>
          <button
            type="button"
            onClick={onSecondaryAction}
            className="w-full py-3 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 font-medium transition-colors"
          >
            Registrar entreno manual
          </button>
        </div>
      </section>
    );
  }

  const previewExercises = data.exercises.slice(0, 4);
  const remaining = Math.max(0, data.exerciseCount - previewExercises.length);

  return (
    <section className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900">
          Entrenamiento de Hoy
        </h2>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle[data.status]}`}>
          {statusLabel[data.status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
          <p className="text-xs text-dark-400">Tipo</p>
          <p className="text-sm font-medium text-dark-100 mt-1">{data.type}</p>
        </div>
        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
          <p className="text-xs text-dark-400">Duración</p>
          <p className="text-sm font-medium text-dark-100 mt-1">{data.estimatedDurationMin} min</p>
        </div>
        <div className="rounded-lg border border-dark-800 bg-dark-950/60 p-3">
          <p className="text-xs text-dark-400">Ejercicios</p>
          <p className="text-sm font-medium text-dark-100 mt-1">{data.exerciseCount}</p>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-sm font-medium text-dark-200 mb-2">Lista rápida</p>
        <ul className="space-y-2">
          {previewExercises.map((exercise) => (
            <li key={exercise.id} className="text-sm text-dark-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
              <span>{exercise.name}</span>
            </li>
          ))}
          {remaining > 0 && (
            <li className="text-sm text-dark-400">+{remaining} más</li>
          )}
        </ul>
      </div>

      <p className="text-xs text-dark-500 mb-4">Última actualización: {data.lastUpdatedLabel}</p>

      <button
        type="button"
        onClick={onPrimaryAction}
        className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
      >
        {ctaLabel[data.status]}
      </button>
    </section>
  );
};
