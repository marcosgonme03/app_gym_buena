// ============================================================================
// NutritionPlanPage — Planificador semanal de dieta
// Ruta: /app/nutrition/plan
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { getWeeklyDietPlan } from '../services/nutritionService';
import { WeeklyDietPlanner, WeeklyDietPlannerSkeleton } from '../components/WeeklyDietPlanner';
import type { DietPlanItem, DayOfWeek, MealType } from '../types';
import { DAY_OF_WEEK_LIST } from '../types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);

// ─── Week macro summary bar ───────────────────────────────────────────────────

interface WeekSummaryProps {
  plan: Record<DayOfWeek, DietPlanItem[]>;
}

const WeekSummary: React.FC<WeekSummaryProps> = ({ plan }) => {
  const allItems = DAY_OF_WEEK_LIST.flatMap(d => plan[d] ?? []);
  if (allItems.length === 0) return null;

  const avgKcal = allItems.reduce((s, i) => s + i.calories,  0) / 7;
  const avgProt = allItems.reduce((s, i) => s + i.protein_g, 0) / 7;
  const avgCarb = allItems.reduce((s, i) => s + i.carbs_g,   0) / 7;
  const avgFat  = allItems.reduce((s, i) => s + i.fat_g,     0) / 7;

  const pills = [
    { label: 'Prom. kcal/día', value: `${Math.round(avgKcal)}`, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'Proteínas',      value: `${Math.round(avgProt)}g`, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
    { label: 'Carbohidratos',  value: `${Math.round(avgCarb)}g`, color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20'},
    { label: 'Grasas',         value: `${Math.round(avgFat)}g`,  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20'},
  ];

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
      <p className="text-xs text-dark-500 uppercase tracking-widest font-semibold mb-4">Promedio diario del plan</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pills.map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-3 border ${bg} text-center`}>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-dark-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const NutritionPlanPage: React.FC = () => {
  const navigate = useNavigate();

  const [plan,    setPlan]    = useState<Record<DayOfWeek, DietPlanItem[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyDietPlan();
      setPlan(data);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Optimistic update ─────────────────────────────────────────────────────
  const handleItemsChange = (dow: DayOfWeek, meal: MealType, items: DietPlanItem[]) => {
    setPlan(prev => {
      if (!prev) return prev;
      // Replace items for this day that belong to this meal, keep the rest
      const otherItems = prev[dow].filter(i => i.meal_type !== meal);
      return { ...prev, [dow]: [...otherItems, ...items] };
    });
  };

  const totalItems = plan ? DAY_OF_WEEK_LIST.reduce<number>((s, d) => s + (plan[d]?.length ?? 0), 0) : 0;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/nutrition')}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-400 hover:text-dark-100 transition-all"
            >
              <IconBack />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <IconCalendar />
                <h1 className="text-2xl lg:text-3xl font-black text-dark-50 tracking-tight">Planificador semanal</h1>
              </div>
              <p className="text-sm text-dark-500 mt-0.5">
                Define tu dieta para toda la semana · {totalItems} alimento{totalItems !== 1 ? 's' : ''} planificado{totalItems !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/nutrition')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold hover:bg-primary-500/20 transition-all"
          >
            Ver hoy
          </button>
        </div>

        {/* ── Info banner ──────────────────────────────────────────────────── */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-xs text-dark-400 leading-relaxed">
            Diseña tu dieta semanal aquí. Cada día, la página de Nutrición mostrará automáticamente los alimentos planificados.
            Márcalos como consumidos para registrar tu ingesta real.
          </p>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={load} className="text-xs text-red-400 underline font-semibold">Reintentar</button>
          </div>
        )}

        {/* ── Week summary ─────────────────────────────────────────────────── */}
        {plan && !loading && <WeekSummary plan={plan} />}

        {/* ── Day grid ─────────────────────────────────────────────────────── */}
        {loading ? (
          <WeeklyDietPlannerSkeleton />
        ) : plan ? (
          <WeeklyDietPlanner plan={plan} onItemsChange={handleItemsChange} />
        ) : null}
      </div>
    </div>
  );
};
