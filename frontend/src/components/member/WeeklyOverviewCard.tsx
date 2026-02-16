import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WeeklyStats } from '@/lib/supabase/types';
import { getWeeklyStats, insertWorkoutLog } from '@/services/workoutLogs';

interface WeeklyOverviewCardProps {
  weekStart?: string;
  weekEnd?: string;
  stats?: WeeklyStats | null; // Datos externos del dashboard
  loading?: boolean; // Estado de carga externo
  onReload?: () => void; // Callback para recargar datos
}

export const WeeklyOverviewCard: React.FC<WeeklyOverviewCardProps> = ({ 
  weekStart, 
  weekEnd, 
  stats: externalStats,
  loading: externalLoading,
  onReload
}) => {
  const { profile } = useAuth();
  const [internalStats, setInternalStats] = useState<WeeklyStats | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Usar datos externos si están disponibles, si no cargar internamente
  const stats = externalStats !== undefined ? externalStats : internalStats;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  // Cargar estadísticas semanales solo si no vienen del padre
  const loadStats = async () => {
    if (externalStats !== undefined) return; // Usar datos del padre
    if (!profile || profile.role !== 'member') {
      setInternalLoading(false);
      return;
    }
    
    try {
      setInternalLoading(true);
      const weeklyStats = await getWeeklyStats(undefined, weekStart, weekEnd);
      setInternalStats(weeklyStats);
    } catch (error) {
      console.error('[WeeklyOverviewCard] Error al cargar stats:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (externalStats === undefined) {
      loadStats();
    }
  }, [weekStart, weekEnd, externalStats]);

  // Registrar entreno
  const handleRegisterWorkout = async () => {
    if (registering) return;

    try {
      setRegistering(true);
      setToast(null);

      await insertWorkoutLog({
        workout_type: 'general',
        notes: 'Entrenamiento registrado desde dashboard'
      });

      // Recargar stats (usar callback del padre o interno)
      if (onReload) {
        await onReload();
      } else {
        await loadStats();
      }

      // Mostrar toast de éxito
      setToast({ message: '¡Entreno registrado! 💪', type: 'success' });

      // Auto-ocultar toast después de 3 segundos
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('[WeeklyOverviewCard] Error al registrar entreno:', error);
      setToast({ 
        message: error.message || 'Error al registrar entrenamiento', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setRegistering(false);
    }
  };

  if (!profile || profile.role !== 'member') return null;

  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="h-5 sm:h-6 bg-dark-800 rounded w-28 sm:w-32"></div>
          <div className="h-16 sm:h-20 bg-dark-800 rounded"></div>
          <div className="h-9 sm:h-10 bg-dark-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const isGoalReached = stats.weeklyCount >= stats.weeklyGoal;

  return (
    <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm relative">
      {/* Toast de feedback */}
      {toast && (
        <div
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg z-10 text-xs sm:text-sm ${
            toast.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      <h2 className="text-base sm:text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900 mb-3 sm:mb-4">
        Esta Semana
      </h2>

      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Entrenamientos completados */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
              Entrenamientos completados
            </span>
            <span className="text-xl sm:text-2xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">
              {stats.weeklyCount} <span className="text-sm sm:text-base font-normal text-dark-400">/ {stats.weeklyGoal}</span>
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="relative w-full h-2 sm:h-2.5 lg:h-3 bg-dark-800 dark:bg-dark-800 light:bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                isGoalReached
                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                  : 'bg-gradient-to-r from-primary-500 to-primary-400'
              }`}
              style={{ width: `${stats.weeklyPercent}%` }}
            />
          </div>

          <p className="text-[10px] sm:text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1.5 sm:mt-2">
            {isGoalReached
              ? '¡Meta alcanzada! 🎉'
              : `Falta${stats.weeklyGoal - stats.weeklyCount === 1 ? '' : 'n'} ${stats.weeklyGoal - stats.weeklyCount} entreno${stats.weeklyGoal - stats.weeklyCount === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Racha */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl">🔥</div>
            <div>
              <p className="text-xs sm:text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
                Racha actual
              </p>
              <p className="text-lg sm:text-xl font-bold text-orange-400 dark:text-orange-400 light:text-orange-600">
                {stats.streakDays} día{stats.streakDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {stats.streakDays > 0 && (
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-dark-500 dark:text-dark-500 light:text-gray-500">
                ¡Sigue así!
              </p>
            </div>
          )}
        </div>

        {/* Próxima clase reservada */}
        <div className="p-3 sm:p-4 bg-dark-800/50 border border-dark-700/50 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-1">
                Próxima clase
              </p>
              {stats.nextBookedClass ? (
                <div>
                  <p className="text-sm sm:text-base font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900">
                    {stats.nextBookedClass.name}
                  </p>
                  <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                    {new Date(stats.nextBookedClass.date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })} • {stats.nextBookedClass.time}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-dark-500 dark:text-dark-500 light:text-gray-500">
                  Aún no hay reservas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CTA principal */}
        <button
          onClick={handleRegisterWorkout}
          disabled={registering}
          className={`w-full py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
            isGoalReached
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {registering ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando...
            </span>
          ) : isGoalReached ? (
            '¡Mantener racha! 💪'
          ) : (
            'Registrar entreno'
          )}
        </button>

        {/* Info adicional */}
        <p className="text-[10px] sm:text-xs text-center text-dark-500 dark:text-dark-500 light:text-gray-500">
          {isGoalReached
            ? 'Ya alcanzaste tu meta semanal. ¡Puedes seguir registrando!'
            : 'Registra tus entrenamientos para mantener tu racha'}
        </p>
      </div>
    </div>
  );
};
