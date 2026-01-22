import React from 'react';
import { CheckCircle2, RefreshCw, Calendar, PenLine } from 'lucide-react';

interface QuickActionsProps {
  onCompleteWorkout?: () => void;
  onChangeWorkout?: () => void;
  onBookClass?: () => void;
  onAddNote?: () => void;
  workoutCompleted?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onCompleteWorkout,
  onChangeWorkout,
  onBookClass,
  onAddNote,
  workoutCompleted = false
}) => {
  const actions = [
    {
      id: 'complete',
      label: workoutCompleted ? 'Completado' : 'Marcar completado',
      icon: CheckCircle2,
      onClick: onCompleteWorkout,
      enabled: !workoutCompleted && !!onCompleteWorkout,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      disabledColor: 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500',
    },
    {
      id: 'change',
      label: 'Cambiar entreno',
      icon: RefreshCw,
      onClick: onChangeWorkout,
      enabled: !!onChangeWorkout && !workoutCompleted,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
      disabledColor: 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500',
    },
    {
      id: 'book',
      label: 'Reservar clase',
      icon: Calendar,
      onClick: onBookClass,
      enabled: !!onBookClass,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-300',
      disabledColor: 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500',
    },
    {
      id: 'note',
      label: 'Añadir nota',
      icon: PenLine,
      onClick: onAddNote,
      enabled: !!onAddNote,
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-700 dark:text-orange-300',
      disabledColor: 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500',
    }
  ];

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl p-4 lg:p-5 shadow-sm border border-gray-100 dark:border-dark-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50 mb-3">
        Acciones Rápidas
      </h3>

      <div className="grid grid-cols-2 gap-2 lg:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const isDisabled = !action.enabled;

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={isDisabled}
              className={`
                relative p-3 lg:p-4 rounded-lg border transition-all duration-200
                ${isDisabled 
                  ? `${action.disabledColor} cursor-not-allowed border-transparent` 
                  : `${action.bgColor} ${action.borderColor} hover:shadow-md active:scale-95`
                }
              `}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isDisabled 
                    ? 'bg-gray-200 dark:bg-dark-700' 
                    : `bg-gradient-to-br ${action.color}`
                  }
                `}>
                  <Icon className={`w-5 h-5 ${isDisabled ? 'text-gray-400 dark:text-dark-500' : 'text-white'}`} />
                </div>
                <span className={`
                  text-xs font-medium
                  ${isDisabled ? 'text-gray-400 dark:text-dark-500' : action.textColor}
                `}>
                  {action.label}
                </span>
              </div>

              {/* Subtle shine effect on hover */}
              {!isDisabled && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-dark-400 mt-3 text-center">
        {workoutCompleted 
          ? '¡Entrenamiento completado! 🎉' 
          : 'Gestiona tu entrenamiento de hoy'
        }
      </p>
    </div>
  );
};

export default QuickActions;
