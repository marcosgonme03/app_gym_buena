import React from 'react';
import { StreakData } from '../../types/member';
import { Flame, Trophy, Star, Award } from 'lucide-react';

interface StreakTrackerProps {
  streakData: StreakData;
  onViewAchievements?: () => void;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ streakData, onViewAchievements }) => {
  const { current, longest, achievements } = streakData;

  // Get recent achievements (last 3)
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);

  const getStreakMessage = () => {
    if (current === 0) return 'Empieza tu racha hoy';
    if (current === 1) return '¡Primer día!';
    if (current < 7) return '¡Buen comienzo!';
    if (current < 14) return '¡Una semana completa!';
    if (current < 30) return '¡Imparable!';
    return '¡Eres una máquina!';
  };

  const getStreakColor = () => {
    if (current === 0) return 'from-gray-400 to-gray-500';
    if (current < 7) return 'from-orange-400 to-red-500';
    if (current < 14) return 'from-orange-500 to-red-600';
    if (current < 30) return 'from-red-500 to-pink-600';
    return 'from-red-600 to-purple-700';
  };

  const getRarityColor = (rarity: 'common' | 'rare' | 'epic') => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300';
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl p-5 lg:p-6 shadow-sm border border-gray-100 dark:border-dark-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-50 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Racha y Logros
        </h3>
      </div>

      {/* Streak display */}
      <div className="relative mb-6">
        <div className={`
          bg-gradient-to-br ${getStreakColor()} 
          rounded-2xl p-6 text-center relative overflow-hidden
        `}>
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Flame icon */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <Flame className={`w-12 h-12 text-white ${current > 0 ? 'animate-pulse' : ''}`} />
                {current >= 7 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Current streak */}
            <div className="mb-2">
              <div className="text-5xl font-black text-white mb-1">
                {current}
              </div>
              <div className="text-white/90 text-sm font-semibold uppercase tracking-wide">
                {current === 1 ? 'día' : 'días'} consecutivos
              </div>
            </div>

            {/* Message */}
            <div className="text-white/80 text-xs font-medium">
              {getStreakMessage()}
            </div>
          </div>
        </div>

        {/* Longest streak badge */}
        {longest > 0 && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-900 dark:bg-dark-950 text-white px-3 py-1 rounded-full text-xs font-semibold border-2 border-white dark:border-dark-900 shadow-lg flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              Mejor racha: {longest} {longest === 1 ? 'día' : 'días'}
            </div>
          </div>
        )}
      </div>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-dark-300">
              Logros Recientes
            </h4>
            {onViewAchievements && (
              <button
                onClick={onViewAchievements}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="space-y-2">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`
                  p-3 rounded-lg border transition-all hover:shadow-sm
                  ${getRarityColor(achievement.rarity)}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                        {achievement.title}
                      </h5>
                      <span className="text-xs opacity-60 whitespace-nowrap">
                        {new Date(achievement.unlockedAt).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentAchievements.length === 0 && (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-2">
            <Star className="w-6 h-6 text-gray-400 dark:text-dark-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-400">
            Completa entrenamientos para desbloquear logros
          </p>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;
