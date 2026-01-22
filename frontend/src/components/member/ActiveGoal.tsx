import React from 'react';
import { UserGoal, GOAL_TYPE_NAMES } from '../../types/member';
import { Target, Calendar, TrendingUp } from 'lucide-react';

interface ActiveGoalProps {
  goal: UserGoal | null;
  onEditGoal?: () => void;
}

const ActiveGoal: React.FC<ActiveGoalProps> = ({ goal, onEditGoal }) => {
  if (!goal) {
    return (
      <div className="bg-white dark:bg-dark-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            Tu Objetivo
          </h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-dark-400 mb-3">
            No tienes un objetivo activo
          </p>
          <button
            onClick={onEditGoal}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Configurar objetivo
          </button>
        </div>
      </div>
    );
  }

  const getDaysRemaining = () => {
    const today = new Date();
    const target = new Date(goal.targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const progressPercentage = goal.currentProgress;

  return (
    <div className="bg-gradient-to-br from-primary-50 to-cyan-50 dark:from-dark-900 dark:to-dark-800 rounded-xl p-5 shadow-sm border border-primary-100 dark:border-dark-700 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute top-0 right-0 opacity-10 dark:opacity-5">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" className="text-primary-500"/>
          <circle cx="60" cy="60" r="35" stroke="currentColor" strokeWidth="2" className="text-primary-500"/>
          <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="2" className="text-primary-500"/>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            Objetivo Activo
          </h3>
          {onEditGoal && (
            <button
              onClick={onEditGoal}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Goal type */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-dark-50">
              {GOAL_TYPE_NAMES[goal.goalType]}
            </h4>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-dark-300">Progreso</span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progressPercentage}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Date and days remaining */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-dark-300">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs">
                {new Date(goal.targetDate).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-semibold text-gray-900 dark:text-dark-50">
                {daysRemaining > 0 ? `${daysRemaining} días` : 'Fecha alcanzada'}
              </span>
            </div>
          </div>

          {/* Metrics if available */}
          {goal.metrics && (goal.metrics.currentWeight || goal.metrics.currentBodyFat) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary-100 dark:border-dark-700">
              {goal.metrics.currentWeight && goal.metrics.targetWeight && (
                <div className="text-center p-2 bg-white dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-dark-400">Peso</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-dark-50">
                    {goal.metrics.currentWeight} kg
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    → {goal.metrics.targetWeight} kg
                  </p>
                </div>
              )}
              {goal.metrics.currentBodyFat && goal.metrics.targetBodyFat && (
                <div className="text-center p-2 bg-white dark:bg-dark-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-dark-400">Grasa</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-dark-50">
                    {goal.metrics.currentBodyFat}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    → {goal.metrics.targetBodyFat}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveGoal;
