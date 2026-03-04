// ============================================================================
// TrainingPage — Módulo principal de Entrenamientos
// Ruta: /app/workout
// ============================================================================

import React, { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { useAuth } from '@/contexts/AuthContext';

// Feature imports
import { useTrainingStats }  from '../hooks/useTrainingStats';
import { useCalendar }       from '../hooks/useCalendar';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import { StatsCards }        from '../components/StatsCards';
import { CalendarWidget }    from '../components/CalendarWidget';
import { HistoryCard, HistoryCardSkeleton } from '../components/HistoryCard';
import { DaySessionCard }    from '../components/DaySessionCard';
import { SelectRoutineModal }  from '../modals/SelectRoutineModal';
import { SessionDetailModal }  from '../modals/SessionDetailModal';
import { ToastProvider, useToast } from '../components/Toast';
import {
  createSessionFromTodayPlan,
  createSessionWithRoutine,
  getActiveSession,
  repeatSession,
} from '../services/trainingService';
import type { HistoryItem, Routine } from '../types';

// ─── Inner page (needs toast context) ───────────────────────────────────────
const TrainingPageInner: React.FC = () => {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast }   = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [ctaLoading, setCtaLoading]         = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routineModalDate, setRoutineModalDate] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { stats, loading: statsLoading } = useTrainingStats();

  const todayISO = new Date().toISOString().split('T')[0];
  const initialDate = searchParams.get('date') || todayISO;

  const {
    year, month, calDays, monthName,
    selectedDate, calendarData, daySessions,
    loading: calLoading, dayLoading,
    selectDate, prevMonth, nextMonth, goToToday,
    refresh: refreshCalendar, refreshDay,
  } = useCalendar(initialDate);

  const {
    items: historyItems, loading: histLoading, hasMore,
    loadMore, refresh: refreshHistory,
  } = useWorkoutHistory();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectDate = useCallback((iso: string) => {
    selectDate(iso);
    setSearchParams({ date: iso }, { replace: true });
  }, [selectDate, setSearchParams]);

  /** "Crear plan para hoy" — flujo principal */
  const handleCreateTodayPlan = useCallback(async () => {
    if (ctaLoading) return;
    try {
      setCtaLoading(true);

      // 1. Si ya existe sesión activa hoy → redirigir directamente
      const active = await getActiveSession();
      if (active?.id) {
        toast('Tienes una sesión activa, continuando...', 'success');
        navigate(`/app/workout/sesion/${active.id}`);
        return;
      }

      // 2. Intentar crear desde el plan semanal
      const session = await createSessionFromTodayPlan();
      if (session?.id) {
        toast('Sesión creada correctamente', 'success');
        await Promise.all([refreshCalendar(), refreshDay(todayISO)]);
        navigate(`/app/workout/sesion/${session.id}`);
        return;
      }

      // 3. Sin rutina asignada para hoy → avisar y redirigir al plan semanal
      toast('No tienes rutina asignada para hoy. Añade una en el plan semanal.', 'error');
      navigate('/app/workout/plan-semanal');
    } catch (err: any) {
      toast(err.message || 'Error al iniciar entrenamiento', 'error');
    } finally {
      setCtaLoading(false);
    }
  }, [ctaLoading, toast, refreshCalendar, refreshDay, navigate, todayISO]);

  /** Crear sesión para un día específico (desde calendario) */
  const handleCreateDaySession = useCallback((date: string) => {
    setRoutineModalDate(date);
    setShowRoutineModal(true);
  }, []);

  /** Routine selected in modal */
  const handleRoutineSelected = useCallback(async (routine: Routine) => {
    if (!routineModalDate) return;
    setShowRoutineModal(false);
    try {
      setCtaLoading(true);
      const session = await createSessionWithRoutine(routine.id, routineModalDate);
      toast('Sesión creada correctamente', 'success');
      await Promise.all([refreshCalendar(), refreshDay(routineModalDate)]);
      navigate(`/app/workout/sesion/${session.id}`);
    } catch (err: any) {
      toast(err.message || 'No se pudo crear la sesión', 'error');
    } finally {
      setCtaLoading(false);
    }
  }, [routineModalDate, toast, refreshCalendar, refreshDay, navigate]);

  /** Free workout selected in modal */
  const handleCreateFree = useCallback(() => {
    setShowRoutineModal(false);
    const date = routineModalDate || todayISO;
    navigate(`/app/workout/crear?date=${date}`);
  }, [routineModalDate, todayISO, navigate]);

  /** Repeat session from history */
  const handleRepeat = useCallback(async (item: HistoryItem) => {
    try {
      const session = await repeatSession(item.id);
      toast('Sesión creada para hoy', 'success');
      await Promise.all([refreshCalendar(), refreshHistory()]);
      navigate(`/app/workout/sesion/${session.id}`);
    } catch (err: any) {
      toast(err.message || 'No se pudo repetir la sesión', 'error');
    }
  }, [toast, refreshCalendar, refreshHistory, navigate]);

  if (!profile) return null;

  const levelLabel = profile.level
    ? ({ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' } as Record<string,string>)[profile.level] ?? 'Intermedio'
    : 'Intermedio';

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-dark-50 tracking-tight">Entrenamientos</h1>
            <p className="text-sm text-dark-500 mt-1">
              {profile.name
                ? `Hola, ${profile.name.split(' ')[0]}`
                : 'Tu módulo de entrenamiento'}
              {' '}· Nivel {levelLabel}
            </p>
          </div>

          {/* CTA Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate('/app/workout/historial')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 text-sm font-semibold text-dark-300 hover:text-dark-100 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial
            </button>
            <button
              onClick={() => navigate('/app/workout/plan-semanal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 text-sm font-semibold text-dark-300 hover:text-dark-100 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Plan semanal
            </button>
            <button
              onClick={handleCreateTodayPlan}
              disabled={ctaLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all duration-150 disabled:opacity-70"
            >
              {ctaLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Crear plan para hoy
            </button>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <StatsCards stats={stats} loading={statsLoading} />
        </div>

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* Left: Calendar + selected day */}
          <div className="space-y-4">
            <CalendarWidget
              year={year}
              month={month}
              calDays={calDays}
              monthName={monthName}
              calendarData={calendarData}
              selectedDate={selectedDate}
              loading={calLoading}
              onSelectDate={handleSelectDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onGoToToday={goToToday}
            />

            <DaySessionCard
              date={selectedDate}
              sessions={daySessions}
              loading={dayLoading}
              onCreateDay={handleCreateDaySession}
            />
          </div>

          {/* Right: History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-dark-100">Historial</h2>
              <button
                onClick={() => navigate('/app/workout/historial')}
                className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors"
              >
                Ver todo →
              </button>
            </div>

            {histLoading && historyItems.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <HistoryCardSkeleton key={i} />)}
              </div>
            ) : historyItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {historyItems.map(item => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onViewDetail={setSelectedHistoryItem}
                      onRepeat={handleRepeat}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={loadMore}
                      disabled={histLoading}
                      className="px-6 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-sm font-medium text-dark-400 hover:text-dark-200 border border-dark-700 transition-all duration-150 disabled:opacity-50"
                    >
                      {histLoading ? 'Cargando…' : 'Ver más'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="bg-dark-900 border border-dark-800 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5h16.5M3.75 13.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 013.75 3.75h16.5A2.25 2.25 0 0122.5 6v5.25a2.25 2.25 0 01-2.25 2.25" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-dark-300">Sin historial todavía</p>
                <p className="text-xs text-dark-600 mt-1 max-w-xs">
                  Completa tu primer entrenamiento y aquí aparecerá tu historial.
                </p>
                <button
                  onClick={handleCreateTodayPlan}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-sm font-bold text-white transition-all duration-150"
                >
                  Crear mi primer entrenamiento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <SelectRoutineModal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        onSelectRoutine={handleRoutineSelected}
        onCreateFree={handleCreateFree}
        title="Elegir rutina para hoy"
        subtitle="No tienes rutina asignada para hoy. Elige una o crea un entrenamiento libre."
      />

      <SessionDetailModal
        item={selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
        onRepeat={handleRepeat}
      />
    </div>
  );
};

// ─── Wrapper with ToastProvider ───────────────────────────────────────────────
export const TrainingPage: React.FC = () => (
  <ToastProvider>
    <TrainingPageInner />
  </ToastProvider>
);
