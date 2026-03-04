// ─── Types ────────────────────────────────────────────────────────────────────
export * from './types';

// ─── Service ─────────────────────────────────────────────────────────────────
export * from './services/trainingService';

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useTrainingStats }  from './hooks/useTrainingStats';
export { useWeeklyPlan, DAY_LABELS, DAY_SHORT, getTodayDayOfWeek } from './hooks/useWeeklyPlan';
export { useCalendar, buildCalendarGrid, MONTH_NAMES_ES }          from './hooks/useCalendar';
export { useActiveSession }  from './hooks/useActiveSession';
export { useWorkoutHistory } from './hooks/useWorkoutHistory';

// ─── Components ──────────────────────────────────────────────────────────────
export { StatsCards }                          from './components/StatsCards';
export { CalendarWidget }                      from './components/CalendarWidget';
export { HistoryCard, HistoryCardSkeleton }    from './components/HistoryCard';
export { ToastProvider, useToast }             from './components/Toast';
export { DaySessionCard }                      from './components/DaySessionCard';

// ─── Modals ──────────────────────────────────────────────────────────────────
export { SelectRoutineModal }  from './modals/SelectRoutineModal';
export { SessionDetailModal }  from './modals/SessionDetailModal';
export { ConfirmModal }        from './modals/ConfirmModal';

// ─── Pages ───────────────────────────────────────────────────────────────────
export { TrainingPage }         from './pages/TrainingPage';
export { WeeklyPlanPage }       from './pages/WeeklyPlanPage';
export { SessionPage }          from './pages/SessionPage';
export { TrainingCreatePage }   from './pages/TrainingCreatePage';
export { WorkoutHistoryPage }   from './pages/WorkoutHistoryPage';
