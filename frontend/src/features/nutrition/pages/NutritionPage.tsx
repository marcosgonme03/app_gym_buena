// ============================================================================
// NutritionPage — Módulo principal de Nutrición
// Ruta: /app/nutrition
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import {
  getTodaySummary,
  getNutritionStats,
  getNutritionEvolution,
  addNutritionEntry,
  deleteNutritionEntry,
  getTodayDiet,
  markDietItemConsumed,
  unmarkDietItemConsumed,
} from '../services/nutritionService';
import { DailySummaryCard, DailySummaryCardSkeleton } from '../components/DailySummaryCard';
import { MealSection }                                from '../components/MealSection';
import { AddFoodModal }                               from '../components/AddFoodModal';
import {
  NutritionEvolutionChart,
  NutritionEvolutionChartSkeleton,
} from '../components/NutritionEvolutionChart';
import type {
  DailySummary,
  NutritionStats,
  NutritionEvolutionPoint,
  MealType,
  AddNutritionEntryPayload,
  TodayDietItem,
} from '../types';
import { MEAL_TYPES, MEAL_LABELS, MEAL_ICONS, DEFAULT_DAILY_GOAL } from '../types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconHistory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const IconRefresh = ({ spin }: { spin: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 ${spin ? 'animate-spin' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color, bgColor, borderColor }) => (
  <div className={`rounded-2xl p-5 ${bgColor} border ${borderColor} flex flex-col gap-1.5`}>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    <span className="text-xs font-semibold text-dark-400">{label}</span>
    {sub && <span className="text-xs text-dark-600">{sub}</span>}
  </div>
);

const StatCardSkeleton = () => (
  <div className="rounded-2xl p-5 bg-dark-900 border border-dark-800 animate-pulse space-y-2">
    <div className="h-8 w-20 bg-dark-800 rounded-lg" />
    <div className="h-3 w-16 bg-dark-800 rounded" />
  </div>
);

// ─── Error banner ────────────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
    <p className="text-sm text-red-400">{message}</p>
    <button onClick={onRetry} className="text-xs text-red-400 hover:text-red-300 font-semibold underline">
      Reintentar
    </button>
  </div>
);

// ─── Today diet section ───────────────────────────────────────────────────────

interface TodayDietSectionProps {
  items: TodayDietItem[];
  loading: boolean;
  onToggleConsumed: (item: TodayDietItem) => void;
  toggling: string | null;
  onGoToPlan: () => void;
}

const TodayDietSection: React.FC<TodayDietSectionProps> = ({
  items,
  loading,
  onToggleConsumed,
  toggling,
  onGoToPlan,
}) => {
  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-dark-800 rounded" />
          <div className="h-4 w-20 bg-dark-800 rounded" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-dark-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-dark-300 mb-1">Sin plan para hoy</h2>
          <p className="text-xs text-dark-500">No hay dieta planificada para este día de la semana.</p>
        </div>
        <button
          onClick={onGoToPlan}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold hover:bg-primary-500/20 transition-all whitespace-nowrap"
        >
          <IconCalendar />
          Crear plan
        </button>
      </div>
    );
  }

  const totalConsumed = items.filter(i => i.consumed).length;
  const totalItems    = items.length;
  const pct           = Math.round((totalConsumed / totalItems) * 100);

  const byMeal = MEAL_TYPES.reduce(
    (acc, m) => ({ ...acc, [m]: items.filter(i => i.meal_type === m) }),
    {} as Record<MealType, TodayDietItem[]>,
  );

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-widest">Plan de hoy</h2>
          <p className="text-xs text-dark-600 mt-0.5">
            {totalConsumed}/{totalItems} consumidos · {pct}%
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-emerald-400 font-semibold">{pct}%</span>
          </div>
          <button
            onClick={onGoToPlan}
            className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 border border-primary-500/20 transition-all"
          >
            Editar plan
          </button>
        </div>
      </div>

      {/* Meals grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {MEAL_TYPES.map(meal => {
          const mealItems = byMeal[meal] ?? [];
          if (mealItems.length === 0) return null;
          return (
            <div key={meal} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{MEAL_ICONS[meal]}</span>
                <span className="text-xs font-bold text-dark-300 uppercase tracking-wide">
                  {MEAL_LABELS[meal]}
                </span>
              </div>
              <div className="space-y-1.5">
                {mealItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                      item.consumed
                        ? 'bg-emerald-500/8 border-emerald-500/20'
                        : 'bg-dark-800/40 border-dark-700 hover:border-dark-600'
                    }`}
                    onClick={() => onToggleConsumed(item)}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                      item.consumed ? 'bg-emerald-500 border-emerald-500' : 'border-dark-600 group-hover:border-dark-400'
                    } ${toggling === item.id ? 'opacity-50' : ''}` }>
                      {item.consumed && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    {/* Food info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate transition-all ${
                        item.consumed ? 'text-dark-400 line-through' : 'text-dark-200'
                      }`}>
                        {item.food_name}
                      </p>
                      <p className="text-[10px] text-dark-500">{item.grams}g</p>
                    </div>
                    {/* Macros */}
                    <div className="text-right text-[10px] text-dark-500 flex-shrink-0">
                      <p className="text-orange-400">{Math.round(item.calories)} kcal</p>
                      <p className="text-blue-400">{item.protein_g}g P</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const NutritionPage: React.FC = () => {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────────
  const [summary,   setSummary]   = useState<DailySummary | null>(null);
  const [stats,     setStats]     = useState<NutritionStats | null>(null);
  const [evolution, setEvolution] = useState<NutritionEvolutionPoint[]>([]);
  const [todayDiet, setTodayDiet] = useState<TodayDietItem[]>([]);

  const [loadingSummary,   setLoadingSummary]   = useState(true);
  const [loadingStats,     setLoadingStats]     = useState(true);
  const [loadingEvolution, setLoadingEvolution] = useState(true);
  const [loadingDiet,      setLoadingDiet]      = useState(true);

  const [errorSummary,   setErrorSummary]   = useState<string | null>(null);
  const [errorStats,     setErrorStats]     = useState<string | null>(null);
  const [errorEvolution, setErrorEvolution] = useState<string | null>(null);

  const [modalOpen,     setModalOpen]     = useState(false);
  const [modalMeal,     setModalMeal]     = useState<MealType>('desayuno');
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      setErrorSummary(null);
      const data = await getTodaySummary();
      setSummary(data);
    } catch (e: any) {
      setErrorSummary(e.message || 'No se pudo cargar el resumen');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setErrorStats(null);
      const data = await getNutritionStats();
      setStats(data);
    } catch (e: any) {
      setErrorStats(e.message || 'No se pudieron cargar las estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadEvolution = useCallback(async () => {
    try {
      setLoadingEvolution(true);
      setErrorEvolution(null);
      const data = await getNutritionEvolution();
      setEvolution(data);
    } catch (e: any) {
      setErrorEvolution(e.message || 'No se pudo cargar la evolución');
    } finally {
      setLoadingEvolution(false);
    }
  }, []);

  const loadDiet = useCallback(async () => {
    try {
      setLoadingDiet(true);
      const data = await getTodayDiet();
      setTodayDiet(data);
    } catch {
      setTodayDiet([]);
    } finally {
      setLoadingDiet(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadStats(), loadEvolution(), loadDiet()]);
  }, [loadSummary, loadStats, loadEvolution, loadDiet]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    await loadAll();
    setRefreshingAll(false);
  };

  const handleAddFood = (meal: MealType) => {
    setModalMeal(meal);
    setModalOpen(true);
  };

  const handleSubmitFood = async (payload: AddNutritionEntryPayload) => {
    await addNutritionEntry(payload);
    // Refresh summary + evolution quietly
    await Promise.all([loadSummary(), loadEvolution()]);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteNutritionEntry(id);
    await Promise.all([loadSummary(), loadEvolution()]);
  };

  const handleToggleConsumed = async (item: TodayDietItem) => {
    if (togglingId) return;
    setTogglingId(item.id);
    try {
      if (item.consumed && item.entry_id) {
        await unmarkDietItemConsumed(item.entry_id);
        setTodayDiet(prev =>
          prev.map(i => i.id === item.id ? { ...i, consumed: false, entry_id: null } : i),
        );
      } else {
        const entry = await markDietItemConsumed(item);
        setTodayDiet(prev =>
          prev.map(i => i.id === item.id ? { ...i, consumed: true, entry_id: entry.id } : i),
        );
      }
      await Promise.all([loadSummary(), loadEvolution()]);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const goal  = DEFAULT_DAILY_GOAL;

  // Pre-split entries per meal for the MealSection components
  const allEntries = summary?.entries ?? [];
  const entriesByMeal = MEAL_TYPES.reduce(
    (acc, m) => ({
      ...acc,
      [m]: allEntries.filter(e => e.meal_type === m),
    }),
    {} as Record<MealType, typeof allEntries>,
  );

  const summaryByMeal = MEAL_TYPES.reduce(
    (acc, m) => ({
      ...acc,
      [m]: summary?.meal_summaries.find(s => s.meal_type === m) ?? {
        meal_type: m, total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0, item_count: 0,
      },
    }),
    {} as Record<MealType, NonNullable<DailySummary['meal_summaries'][number]>>,
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-dark-50 tracking-tight">Tu Nutrición</h1>
            <p className="text-sm text-dark-500 mt-1">
              {today} · Objetivo: {goal.calories.toLocaleString()} kcal
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefreshAll}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-sm font-semibold text-dark-400 hover:text-dark-100 transition-all"
            >
              <IconRefresh spin={refreshingAll} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => navigate('/app/nutrition/history')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-sm font-semibold text-dark-300 hover:text-dark-100 transition-all"
            >
              <IconHistory />
              Historial
            </button>
            <button
              onClick={() => navigate('/app/nutrition/plan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-primary-500/30 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-all"
            >
              <IconCalendar />
              Planificar dieta
            </button>
            <button
              onClick={() => handleAddFood('desayuno')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/20"
            >
              <IconPlus />
              Registrar alimento
            </button>
          </div>
        </div>

        {/* ── Sección 1: Resumen diario ────────────────────────────────────── */}
        {loadingSummary ? (
          <DailySummaryCardSkeleton />
        ) : errorSummary ? (
          <ErrorBanner message={errorSummary} onRetry={loadSummary} />
        ) : summary ? (
          <DailySummaryCard summary={summary} goal={goal} />
        ) : null}

        {/* ── Sección 2: Plan de hoy ────────────────────────────────────────── */}
        <TodayDietSection
          items={todayDiet}
          loading={loadingDiet}
          onToggleConsumed={handleToggleConsumed}
          toggling={togglingId}
          onGoToPlan={() => navigate('/app/nutrition/plan')}
        />

        {/* ── Sección 3: Registro manual ───────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-black text-dark-100 mb-4">Registro manual</h2>
          {loadingSummary ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {MEAL_TYPES.map(m => (
                <div key={m} className="bg-dark-900 border border-dark-800 rounded-2xl p-5 animate-pulse space-y-3 h-40">
                  <div className="flex justify-between">
                    <div className="h-5 w-24 bg-dark-800 rounded" />
                    <div className="h-5 w-16 bg-dark-800 rounded" />
                  </div>
                  <div className="h-12 w-full bg-dark-800/60 rounded-xl border border-dashed border-dark-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {MEAL_TYPES.map(meal => (
                <MealSection
                  key={meal}
                  mealType={meal}
                  entries={entriesByMeal[meal] ?? []}
                  summary={summaryByMeal[meal]}
                  onAddFood={handleAddFood}
                  onDeleteEntry={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Sección 3: Evolución 30 días ─────────────────────────────────── */}
        {loadingEvolution ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <div className="h-4 w-32 bg-dark-800 rounded mb-4" />
            <NutritionEvolutionChartSkeleton />
          </div>
        ) : errorEvolution ? (
          <ErrorBanner message={errorEvolution} onRetry={loadEvolution} />
        ) : (
          <NutritionEvolutionChart data={evolution} />
        )}

        {/* ── Sección 4: Estadísticas promedio ─────────────────────────────── */}
        <div>
          <h2 className="text-lg font-black text-dark-100 mb-4">Estadísticas (últimos 30 días)</h2>
          {errorStats && <ErrorBanner message={errorStats} onRetry={loadStats} />}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {loadingStats ? (
              [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
            ) : stats ? (
              <>
                <StatCard
                  label="Prom. Calorías"
                  value={`${Math.round(stats.avg_calories)}`}
                  sub="kcal/día"
                  color="text-orange-400"
                  bgColor="bg-orange-500/8"
                  borderColor="border-orange-500/20"
                />
                <StatCard
                  label="Prom. Proteínas"
                  value={`${Math.round(stats.avg_protein_g)}g`}
                  sub="por día"
                  color="text-blue-400"
                  bgColor="bg-blue-500/8"
                  borderColor="border-blue-500/20"
                />
                <StatCard
                  label="Prom. Carbohidratos"
                  value={`${Math.round(stats.avg_carbs_g)}g`}
                  sub="por día"
                  color="text-emerald-400"
                  bgColor="bg-emerald-500/8"
                  borderColor="border-emerald-500/20"
                />
                <StatCard
                  label="Prom. Grasas"
                  value={`${Math.round(stats.avg_fat_g)}g`}
                  sub="por día"
                  color="text-yellow-400"
                  bgColor="bg-yellow-500/8"
                  borderColor="border-yellow-500/20"
                />
                <StatCard
                  label="Días registrados"
                  value={`${stats.days_logged}`}
                  sub="de los últimos 30"
                  color="text-primary-400"
                  bgColor="bg-primary-500/8"
                  borderColor="border-primary-500/20"
                />
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Modal añadir alimento ─────────────────────────────────────────── */}
      <AddFoodModal
        open={modalOpen}
        initialMealType={modalMeal}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitFood}
      />
    </div>
  );
};
