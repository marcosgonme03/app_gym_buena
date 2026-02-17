import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MemberStatsCard } from '@/components/member/MemberStatsCard';
import { WeeklyOverviewCard } from '@/components/member/WeeklyOverviewCard';
import { TodayTrainingCard, TodayTrainingData } from '@/components/member/TodayTrainingCard';
import { WeeklyProgressCard } from '@/components/member/WeeklyProgressCard';
import { TodayClassesCard } from '@/components/member/TodayClassesCard';
import { WeeklyPlanPreviewCard } from '@/features/member/dashboard/WeeklyPlanPreviewCard';
import { getWeekStart, getWeekEnd } from '@/features/member/workoutPlan/weekHelpers';
import { useDashboardData } from '@/features/member/dashboard/useDashboardData';
import { useTodayWorkout } from '@/features/member/dashboard/hooks/useTodayWorkout';
import { useWeeklyProgress } from '@/features/member/dashboard/hooks/useWeeklyProgress';


export const MemberDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedWeekStart] = useState<string>(() => getWeekStart());
  const selectedWeekEnd = useMemo(() => getWeekEnd(selectedWeekStart), [selectedWeekStart]);
  
  // Hook centralizado que carga ambos datos en paralelo
  const { weeklyStats, planData, loading, reload } = useDashboardData(selectedWeekStart, selectedWeekEnd);
  const {
    data: todayWorkout,
    loading: todayLoading,
    error: todayError,
    startWorkout,
    refresh: refreshToday,
    humanLastUpdated,
  } = useTodayWorkout(planData);
  const {
    data: weeklyProgress,
    loading: weeklyProgressLoading,
    error: weeklyProgressError,
    refresh: refreshWeeklyProgress,
  } = useWeeklyProgress(selectedWeekStart, weeklyStats);

  const todayTrainingData = useMemo<TodayTrainingData | null>(() => {
    if (!todayWorkout) return null;

    const exercises = todayWorkout.plannedWorkout?.exercises || [];

    return {
      status: todayWorkout.status,
      type: todayWorkout.plannedWorkout?.name || 'Plan general',
      estimatedDurationMin: todayWorkout.estimatedDurationMin,
      exerciseCount: todayWorkout.exerciseCount,
      exercises: exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.exercise_name,
      })),
      hasPlannedWorkout: Boolean(todayWorkout.plannedWorkout),
      lastUpdatedLabel: humanLastUpdated,
    };
  }, [todayWorkout, humanLastUpdated]);

  const handleTodayPrimaryAction = async () => {
    if (!todayWorkout || !todayTrainingData) return;

    if (!todayTrainingData.hasPlannedWorkout) {
      navigate('/app/workout-plan');
      return;
    }

    if (todayWorkout.status === 'not_started') {
      await startWorkout();
      await Promise.all([refreshToday(), refreshWeeklyProgress()]);
      navigate('/app/workout/today');
      return;
    }

    if (todayWorkout.status === 'in_progress') {
      navigate('/app/workout/today');
      return;
    }

    if (todayWorkout.status === 'completed' && todayWorkout.session?.id) {
      navigate(`/app/workout/summary/${todayWorkout.session.id}`);
    }
  };

  const handleTodaySecondaryAction = async () => {
    await startWorkout();
    await Promise.all([refreshToday(), refreshWeeklyProgress()]);
    navigate('/app/workout/today?manual=1');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950 light:bg-gray-50 pb-20 lg:pb-0">
      {/* Header Desktop/Mobile Responsive */}
      <header className="bg-gradient-to-br from-dark-900 to-dark-950 dark:from-dark-900 dark:to-dark-950 light:from-white light:to-gray-50 border-b border-dark-800/50 dark:border-dark-800/50 light:border-gray-200 sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:max-w-7xl lg:mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="lg"
              />
              <div>
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">
                  Hola, {profile.name} 👋
                </h1>
                <p className="text-[10px] sm:text-xs lg:text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
                  ¡Listo para entrenar hoy!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="hidden lg:flex p-1.5 sm:p-2 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors"
                title="Ajustes"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="p-1.5 sm:p-2 lg:px-4 lg:py-2 bg-dark-800/50 hover:bg-dark-800 text-dark-400 dark:bg-dark-800/50 dark:hover:bg-dark-800 dark:text-dark-400 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-600 rounded-lg transition-colors lg:flex lg:items-center lg:gap-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline text-dark-200 dark:text-dark-200 light:text-gray-900 font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <BottomNav />

      <main className="w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Desktop: Layout de 2 columnas | Mobile: Stack vertical */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Principal (2/3 en desktop) */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* FASE 2: Vista semanal en móvil */}
            <div className="lg:hidden">
              <WeeklyOverviewCard 
                weekStart={selectedWeekStart}
                weekEnd={selectedWeekEnd}
                stats={weeklyStats}
                loading={loading}
                onReload={reload}
              />
            </div>
            
            {/* Planificación semanal en móvil */}
            <div className="lg:hidden">
              <WeeklyPlanPreviewCard 
                weekStart={selectedWeekStart}
                planData={planData}
                loading={loading}
              />
            </div>
            
            <div className="text-center py-8 sm:py-12 lg:hidden">
              <p className="text-sm sm:text-base text-dark-400 dark:text-dark-400 light:text-gray-600">
                Dashboard en construcción...
              </p>
            </div>

            <div className="hidden lg:block">
              <TodayTrainingCard
                data={todayTrainingData}
                loading={todayLoading}
                error={todayError}
                onRetry={refreshToday}
                onPrimaryAction={handleTodayPrimaryAction}
                onSecondaryAction={handleTodaySecondaryAction}
              />
            </div>

            <div className="hidden lg:block">
              <WeeklyProgressCard
                data={weeklyProgress}
                loading={weeklyProgressLoading}
                error={weeklyProgressError}
                onRetry={refreshWeeklyProgress}
              />
            </div>

            <div className="hidden lg:block">
              <TodayClassesCard />
            </div>
          </div>

          {/* Columna Derecha - Sidebar (1/3 en desktop) */}
          <div className="hidden lg:block lg:col-span-1 space-y-5 lg:space-y-6">
            {/* FASE 2: Vista semanal (desktop) */}
            <WeeklyOverviewCard 
              weekStart={selectedWeekStart}
              weekEnd={selectedWeekEnd}
              stats={weeklyStats}
              loading={loading}
              onReload={reload}
            />
            
            {/* Planificación semanal (desktop) */}
            <WeeklyPlanPreviewCard 
              weekStart={selectedWeekStart}
              planData={planData}
              loading={loading}
            />
            
            {/* Tarjeta de estadísticas del miembro */}
            <MemberStatsCard />
          </div>
        </div>

        {/* Mobile: Mostrar stats card */}
        <div className="lg:hidden mt-4 sm:mt-6">
          <MemberStatsCard />
        </div>

        <div className="lg:hidden mt-4 sm:mt-6 px-3 sm:px-0">
          <TodayClassesCard />
        </div>
      </main>

    </div>
  );
};

export default MemberDashboard;
