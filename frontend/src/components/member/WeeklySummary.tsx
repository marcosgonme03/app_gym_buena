import React from 'react';
import { WeeklySummary as WeeklySummaryType } from '../../types/member';
import { Calendar, Clock, Users, Dumbbell, ArrowRight, CheckCircle2 } from 'lucide-react';

interface WeeklySummaryProps {
  summary: WeeklySummaryType;
  onViewPlanning?: () => void;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ summary, onViewPlanning }) => {
  const { todayWorkout, tomorrowWorkout, nextClass, weekStats } = summary;

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-dark-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          Resumen Semanal
        </h3>
        {onViewPlanning && (
          <button
            onClick={onViewPlanning}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors flex items-center gap-1"
          >
            Ver planificación
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Week progress */}
      <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-cyan-50 dark:from-dark-800 dark:to-dark-800 rounded-lg border border-primary-100 dark:border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700 dark:text-dark-300">Esta semana</span>
          <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
            {weekStats.workoutsCompleted}/{weekStats.workoutsPlanned} entrenamientos
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${(weekStats.workoutsCompleted / weekStats.workoutsPlanned) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-dark-400">
          <span>{weekStats.classesAttended} clases</span>
          <span>{weekStats.totalMinutes} min totales</span>
        </div>
      </div>

      {/* Today's workout */}
      {todayWorkout && (
        <div className="mb-3 p-3 bg-gradient-to-r from-primary-500 to-cyan-500 text-white rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Hoy toca</span>
              </div>
              <h4 className="font-bold text-lg mb-1">{todayWorkout.name}</h4>
              <div className="flex items-center gap-3 text-xs opacity-90">
                <span>{todayWorkout.type}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {todayWorkout.duration} min
                </span>
              </div>
            </div>
            {todayWorkout.completed && (
              <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tomorrow's workout */}
      {tomorrowWorkout && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-dark-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-dark-400">Mañana</span>
          </div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-dark-50 mb-1">
            {tomorrowWorkout.name}
          </h4>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-dark-400">
            <span>{tomorrowWorkout.type}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tomorrowWorkout.duration} min
            </span>
          </div>
        </div>
      )}

      {/* Next class */}
      {nextClass && (
        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Próxima clase</span>
          </div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-dark-50 mb-1">
            {nextClass.name}
          </h4>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-dark-400">
              {new Date(nextClass.date).toLocaleDateString('es-ES', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {nextClass.spotsLeft} plazas libres
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      {onViewPlanning && (
        <button
          onClick={onViewPlanning}
          className="mt-4 w-full py-2.5 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-900 dark:text-dark-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Ver planificación completa
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default WeeklySummary;
