import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyLatestBodyMetric } from '@/services/bodyMetrics';
import { BodyMetric, GoalType } from '@/lib/supabase/types';
import { useNavigate } from 'react-router-dom';

const GOAL_LABELS: Record<GoalType, string> = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  strength: 'Aumentar fuerza',
  endurance: 'Mejorar resistencia',
  mobility: 'Mejorar movilidad',
  health: 'Salud general'
};

const GOAL_EMOJIS: Record<GoalType, string> = {
  lose_fat: '🔥',
  gain_muscle: '💪',
  strength: '🏋️',
  endurance: '🏃',
  mobility: '🧘',
  health: '❤️'
};

export const MemberStatsCard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [latestMetric, setLatestMetric] = useState<BodyMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetric = async () => {
      try {
        const metric = await getMyLatestBodyMetric();
        setLatestMetric(metric);
      } catch (error) {
        console.error('[MemberStats] Error al cargar métrica:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetric();
  }, []);

  if (!profile || profile.role !== 'member') return null;

  const hasGoal = !!profile.goal_type;
  const hasWeight = !!latestMetric;
  const hasHeight = !!profile.height_cm;

  return (
    <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900">
          Mi Perfil de Entrenamiento
        </h2>
        <button
          onClick={() => navigate('/settings')}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
        >
          Editar
        </button>
      </div>

      <div className="space-y-4">
        {/* Objetivo */}
        {hasGoal ? (
          <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{GOAL_EMOJIS[profile.goal_type!]}</span>
              <div className="flex-1">
                <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
                  Objetivo actual
                </p>
                <p className="text-base font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900">
                  {GOAL_LABELS[profile.goal_type!]}
                </p>
                {profile.goal_target_date && (
                  <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                    Fecha objetivo: {new Date(profile.goal_target_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
            {profile.goal_notes && (
              <p className="text-sm text-dark-300 dark:text-dark-300 light:text-gray-700 mt-3 italic">
                "{profile.goal_notes}"
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-200 dark:text-yellow-200 light:text-yellow-800">
                  Define tu objetivo
                </p>
                <p className="text-xs text-yellow-300 dark:text-yellow-300 light:text-yellow-700 mt-1">
                  Completa tu perfil para obtener recomendaciones personalizadas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas corporales */}
        <div className="grid grid-cols-2 gap-3">
          {/* Peso */}
          <div className="p-3 bg-dark-800/50 border border-dark-700/50 rounded-lg">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-dark-700 rounded w-12 mb-2"></div>
                <div className="h-6 bg-dark-700 rounded w-16"></div>
              </div>
            ) : hasWeight ? (
              <>
                <p className="text-xs text-dark-400 dark:text-dark-400 light:text-gray-600 mb-1">
                  Peso actual
                </p>
                <p className="text-xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">
                  {latestMetric.weight_kg} <span className="text-sm font-normal text-dark-400">kg</span>
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                  {new Date(latestMetric.recorded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </>
            ) : (
              <button
                onClick={() => navigate('/settings')}
                className="w-full text-left"
              >
                <p className="text-xs text-dark-400 dark:text-dark-400 light:text-gray-600 mb-1">
                  Peso
                </p>
                <p className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                  + Añadir peso
                </p>
              </button>
            )}
          </div>

          {/* Altura */}
          <div className="p-3 bg-dark-800/50 border border-dark-700/50 rounded-lg">
            {hasHeight ? (
              <>
                <p className="text-xs text-dark-400 dark:text-dark-400 light:text-gray-600 mb-1">
                  Altura
                </p>
                <p className="text-xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">
                  {profile.height_cm} <span className="text-sm font-normal text-dark-400">cm</span>
                </p>
              </>
            ) : (
              <button
                onClick={() => navigate('/settings')}
                className="w-full text-left"
              >
                <p className="text-xs text-dark-400 dark:text-dark-400 light:text-gray-600 mb-1">
                  Altura
                </p>
                <p className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                  + Añadir altura
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Nivel */}
        {profile.level && (
          <div className="flex items-center justify-between p-3 bg-dark-800/30 border border-dark-700/30 rounded-lg">
            <span className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
              Nivel
            </span>
            <span className="text-sm font-medium text-dark-200 dark:text-dark-200 light:text-gray-800 capitalize">
              {profile.level === 'beginner' && '🌱 Principiante'}
              {profile.level === 'intermediate' && '💪 Intermedio'}
              {profile.level === 'advanced' && '🏆 Avanzado'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
