import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyPlanFull } from '../workoutPlan/api';
import { getWeekStart, addWeeks, formatWeekRange, isCurrentWeek } from '../workoutPlan/weekHelpers';
import type { WeeklyPlanFullDTO } from '../workoutPlan/types';

interface WeeklyPlanPreviewCardProps {
  weekStart?: string; // YYYY-MM-DD
  planData?: WeeklyPlanFullDTO | null; // Datos externos del dashboard
  loading?: boolean; // Estado de carga externo
}

export const WeeklyPlanPreviewCard: React.FC<WeeklyPlanPreviewCardProps> = ({
  weekStart: externalWeekStart,
  planData: externalPlanData,
  loading: externalLoading
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [internalWeekStart, setInternalWeekStart] = useState<string>(() => getWeekStart());
  const [internalPlanData, setInternalPlanData] = useState<WeeklyPlanFullDTO | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);

  // Usar datos externos si están disponibles, si no usar internos
  const weekStart = externalWeekStart !== undefined ? externalWeekStart : internalWeekStart;
  const planData = externalPlanData !== undefined ? externalPlanData : internalPlanData;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const loadPlan = async () => {
    if (externalPlanData !== undefined) return; // Usar datos del padre
    if (!profile || profile.role !== 'member') {
      setInternalLoading(false);
      return;
    }

    try {
      setInternalLoading(true);
      const data = await getWeeklyPlanFull(weekStart);
      setInternalPlanData(data);
    } catch (error) {
      console.error('[WeeklyPlanPreviewCard] Error:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (externalPlanData === undefined) {
      loadPlan();
    }
  }, [internalWeekStart, externalPlanData]);

  const handlePrevWeek = () => {
    if (externalWeekStart !== undefined) return; // No permitir navegación si viene del padre
    setInternalWeekStart(prev => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    if (externalWeekStart !== undefined) return; // No permitir navegación si viene del padre
    setInternalWeekStart(prev => addWeeks(prev, 1));
  };

  const handleViewPlan = () => {
    navigate(`/app/workout-plan?week=${weekStart}`);
  };

  if (!profile || profile.role !== 'member') return null;

  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-dark-800 rounded w-40"></div>
          <div className="h-20 bg-dark-800 rounded"></div>
          <div className="h-10 bg-dark-800 rounded"></div>
        </div>
      </div>
    );
  }

  const hasSessions = planData && planData.sessions.length > 0;
  const displaySessions = hasSessions ? planData.sessions.slice(0, 3) : [];

  return (
    <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900">
          Planificación Semanal
        </h2>
        <button
          onClick={handleViewPlan}
          className="text-primary-400 hover:text-primary-300 text-xs sm:text-sm font-medium transition-colors"
        >
          {hasSessions ? 'Editar' : 'Crear'}
        </button>
      </div>

      {/* Navegación de semanas */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={handlePrevWeek}
          disabled={externalWeekStart !== undefined}
          className="p-1.5 hover:bg-dark-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Semana anterior"
        >
          <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-xs sm:text-sm font-medium text-dark-200 dark:text-dark-200 light:text-gray-900">
            {formatWeekRange(weekStart)}
          </p>
          {isCurrentWeek(weekStart) && (
            <p className="text-[10px] text-primary-400 mt-0.5">Semana actual</p>
          )}
        </div>

        <button
          onClick={handleNextWeek}
          disabled={externalWeekStart !== undefined}
          className="p-1.5 hover:bg-dark-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Semana siguiente"
        >
          <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Contenido */}
      {!hasSessions ? (
        /* Estado vacío */
        <div className="p-4 bg-dark-800/30 border border-dark-700/50 rounded-lg text-center">
          <svg className="w-10 h-10 mx-auto mb-2 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-600 mb-3">
            Aún no has creado planificación para esta semana
          </p>
          <button
            onClick={handleViewPlan}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Crear planificación
          </button>
        </div>
      ) : (
        /* Lista de sesiones */
        <div className="space-y-2">
          {displaySessions.map(session => {
            const exerciseCount = session.exercises.length;
            const dayName = new Date(session.session_date).toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNum = new Date(session.session_date).getDate();

            return (
              <div
                key={session.id}
                className="p-3 bg-dark-800/50 border border-dark-700/50 rounded-lg hover:border-dark-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs text-dark-500 uppercase">{dayName}</p>
                      <p className="text-lg font-bold text-dark-200">{dayNum}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-100 dark:text-dark-100 light:text-gray-900">
                        {session.name}
                      </p>
                      <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500">
                        {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}

          {planData.sessions.length > 3 && (
            <p className="text-xs text-center text-dark-500 mt-2">
              +{planData.sessions.length - 3} sesiones más
            </p>
          )}

          {/* CTA para ver plan completo */}
          <button
            onClick={handleViewPlan}
            className="w-full mt-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 text-sm font-medium rounded-lg transition-colors border border-dark-700"
          >
            Ver planificación completa
          </button>
        </div>
      )}
    </div>
  );
};
