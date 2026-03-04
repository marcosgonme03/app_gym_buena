import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopNav } from '@/components/layout/TopNav';
import { MemberStatsCard } from '@/components/member/MemberStatsCard';
import { WeeklyOverviewCard } from '@/components/member/WeeklyOverviewCard';
import { TodayTrainingCard, TodayTrainingData } from '@/components/member/TodayTrainingCard';
import { WeeklyProgressCard } from '@/components/member/WeeklyProgressCard';
import { TodayClassesCard } from '@/components/member/TodayClassesCard';
import { WeeklyPlanPreviewCard } from '@/features/member/dashboard/WeeklyPlanPreviewCard';
import { WorkoutHeroCard } from '@/components/member/WorkoutHeroCard';
import { ProgressSummaryCard } from '@/components/member/ProgressSummaryCard';
import { BodyStatsCard } from '@/components/member/BodyStatsCard';
import { NutritionPlanCard } from '@/components/member/NutritionPlanCard';
import { ChallengeCard } from '@/components/member/ChallengeCard';
import { VideosCard } from '@/components/member/VideosCard';
import { ArticlesCard } from '@/components/member/ArticlesCard';
import { getWeekStart, getWeekEnd } from '@/features/member/workoutPlan/weekHelpers';
import { useDashboardData } from '@/features/member/dashboard/useDashboardData';
import { useTodayWorkout } from '@/features/member/dashboard/hooks/useTodayWorkout';
import { useWeeklyProgress } from '@/features/member/dashboard/hooks/useWeeklyProgress';
import { getMyLatestBodyMetric } from '@/services/bodyMetrics';
import { getWeeklyTotalWeight } from '@/services/workoutLogs';
import type { BodyMetric } from '@/lib/supabase/types';


export const MemberDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedWeekStart] = useState<string>(() => getWeekStart());
  const selectedWeekEnd = useMemo(() => getWeekEnd(selectedWeekStart), [selectedWeekStart]);

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

  // Body metrics for the circular gauges
  const [latestMetric, setLatestMetric] = useState<BodyMetric | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  useEffect(() => {
    getMyLatestBodyMetric()
      .then(m => setLatestMetric(m))
      .catch(() => setLatestMetric(null))
      .finally(() => setMetricsLoading(false));
  }, []);

  // Weekly total weight lifted
  const [weeklyTotalWeight, setWeeklyTotalWeight] = useState(0);
  useEffect(() => {
    getWeeklyTotalWeight(selectedWeekStart, selectedWeekEnd)
      .then(w => setWeeklyTotalWeight(w))
      .catch(() => setWeeklyTotalWeight(0));
  }, [selectedWeekStart, selectedWeekEnd]);

  const todayTrainingData = useMemo<TodayTrainingData | null>(() => {
    if (!todayWorkout) return null;
    const exercises = todayWorkout.plannedWorkout?.exercises || [];
    // Use session_name from manually-created free session as fallback for the display name
    const freeSessionName = (todayWorkout.session as any)?.session_name as string | undefined;
    const workoutType = todayWorkout.plannedWorkout?.name || freeSessionName || 'Plan general';
    // Treat having ANY session (planned OR free) as having something to show
    const hasAnySession = Boolean(todayWorkout.plannedWorkout) || Boolean(todayWorkout.session);
    // Prefer session's estimated_duration_min (set during free session creation) over the calculated fallback
    const durationMin = (todayWorkout.session as any)?.estimated_duration_min ?? todayWorkout.estimatedDurationMin;
    return {
      status: todayWorkout.status,
      type: workoutType,
      estimatedDurationMin: durationMin,
      exerciseCount: todayWorkout.exerciseCount,
      exercises: exercises.map((ex) => ({ id: ex.id, name: ex.exercise_name })),
      hasPlannedWorkout: hasAnySession,
      lastUpdatedLabel: humanLastUpdated,
    };
  }, [todayWorkout, humanLastUpdated]);

  const handleTodayPrimaryAction = async () => {
    if (!todayWorkout || !todayTrainingData) return;
    // No session of any kind → go to create a workout
    if (!todayTrainingData.hasPlannedWorkout) { navigate('/app/workout/crear'); return; }
    if (todayWorkout.status === 'not_started') {
      await startWorkout();
      await Promise.all([refreshToday(), refreshWeeklyProgress()]);
      navigate('/app/workout/today');
      return;
    }
    if (todayWorkout.status === 'in_progress') { navigate('/app/workout/today'); return; }
    if (todayWorkout.status === 'completed' && todayWorkout.session?.id) {
      navigate(`/app/workout/summary/${todayWorkout.session.id}`);
    }
  };

  const handleTodaySecondaryAction = async () => {
    await startWorkout();
    await Promise.all([refreshToday(), refreshWeeklyProgress()]);
    navigate('/app/workout/today?manual=1');
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  if (!profile) return null;

  return (
    <>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DESKTOP  (lg+)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="hidden lg:flex flex-col min-h-screen bg-dark-950">
        <TopNav />

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 space-y-7">

          {/* Welcome */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-dark-50 tracking-tight leading-tight">
                Bienvenido de nuevo,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-300">
                  {profile.name}
                </span>
              </h1>
              <p className="text-dark-400 mt-1 text-sm font-medium">¡Vamos a entrenar!</p>
            </div>
            {/* Streak badge */}
            {(weeklyStats?.streakDays ?? 0) > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-xl flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
                </svg>
                <span className="text-sm font-bold">{weeklyStats!.streakDays} días</span>
              </div>
            )}
          </div>

          {/* Row 1 â€” 3 columns: workout+nutrition | progress+challenge | body stats */}
          <div className="grid grid-cols-12 gap-5">

            <div className="col-span-5 space-y-5">
              <WorkoutHeroCard
                data={todayTrainingData}
                loading={todayLoading}
                error={todayError}
                onRetry={refreshToday}
                onPrimaryAction={handleTodayPrimaryAction}
                onSecondaryAction={handleTodaySecondaryAction}
              />
              <NutritionPlanCard />
            </div>

            <div className="col-span-4 space-y-5">
              <ProgressSummaryCard
                weeklyCount={weeklyStats?.weeklyCount ?? 0}
                totalWeightKg={weeklyTotalWeight}
                weeklyGoal={weeklyStats?.weeklyGoal ?? 3}
                loading={loading}
              />
              <ChallengeCard />
            </div>

            <div className="col-span-3">
              <BodyStatsCard
                weight={latestMetric?.weight_kg ?? null}
                bodyFat={(latestMetric as any)?.body_fat_pct ?? null}
                loading={metricsLoading}
              />
            </div>
          </div>

          {/* Row 2 — Videos + Articles */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
              <VideosCard />
            </div>
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
              <ArticlesCard />
            </div>
          </div>

        </main>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MOBILE  (< lg)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="lg:hidden min-h-screen bg-dark-950 pb-20">
        <header className="bg-gradient-to-br from-dark-900 to-dark-950 border-b border-dark-800/50 sticky top-0 z-40">
          <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar
                  src={profile.avatar_url}
                  name={`${profile.name} ${profile.last_name}`}
                  size="lg"
                />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-dark-50">
                    Hola, {profile.name} ðŸ‘‹
                  </h1>
                  <p className="text-[10px] sm:text-xs text-dark-400">Â¡Listo para entrenar hoy!</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 sm:p-2 bg-dark-800/50 hover:bg-dark-800 text-dark-400 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <BottomNav />

        <main className="w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="space-y-3 sm:space-y-4">
            <WeeklyOverviewCard
              weekStart={selectedWeekStart}
              weekEnd={selectedWeekEnd}
              stats={weeklyStats}
              loading={loading}
              onReload={reload}
            />
            <WeeklyPlanPreviewCard
              weekStart={selectedWeekStart}
              planData={planData}
              loading={loading}
            />
            <TodayTrainingCard
              data={todayTrainingData}
              loading={todayLoading}
              error={todayError}
              onRetry={refreshToday}
              onPrimaryAction={handleTodayPrimaryAction}
              onSecondaryAction={handleTodaySecondaryAction}
            />
            <WeeklyProgressCard
              data={weeklyProgress!}
              loading={weeklyProgressLoading}
              error={weeklyProgressError}
              onRetry={refreshWeeklyProgress}
            />
            <TodayClassesCard />
            <NutritionPlanCard />
            <MemberStatsCard />
          </div>
        </main>
      </div>
    </>
  );
};
