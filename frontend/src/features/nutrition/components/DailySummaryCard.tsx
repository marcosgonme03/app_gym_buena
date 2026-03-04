// ============================================================================
// DailySummaryCard — Resumen diario de macros + barra de progreso
// ============================================================================

import React from 'react';
import type { DailySummary, DailyGoal } from '../types';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const DailySummaryCardSkeleton: React.FC = () => (
  <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-8 w-20 bg-dark-800 rounded-lg" />
          <div className="h-3 w-14 bg-dark-800 rounded" />
        </div>
      ))}
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-dark-800 rounded-full" />
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-dark-800 rounded" />
        <div className="h-3 w-16 bg-dark-800 rounded" />
      </div>
    </div>
  </div>
);

// ─── Macro pill ───────────────────────────────────────────────────────────────

interface MacroPillProps {
  label: string;
  value: number;
  unit?: string;
  color: string;
  textColor: string;
}

const MacroPill: React.FC<MacroPillProps> = ({ label, value, unit = 'g', color, textColor }) => (
  <div className={`rounded-xl p-4 ${color} flex flex-col gap-1`}>
    <span className={`text-2xl font-black ${textColor}`}>{Math.round(value)}<span className="text-sm font-semibold ml-0.5">{unit}</span></span>
    <span className="text-xs text-dark-400 font-medium">{label}</span>
  </div>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  current: number;
  goal: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
  const pct   = Math.min((current / Math.max(goal, 1)) * 100, 100);
  const over  = current > goal;
  const color = over ? 'bg-red-500' : pct >= 80 ? 'bg-emerald-500' : 'bg-primary-500';

  return (
    <div className="space-y-1.5">
      <div className="h-2.5 w-full bg-dark-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-dark-400">{Math.round(current)} kcal consumidas</span>
        <span className={over ? 'text-red-400' : 'text-dark-500'}>
          {over ? `+${Math.round(current - goal)} kcal sobre objetivo` : `${Math.round(goal - current)} kcal restantes`}
        </span>
      </div>
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

interface DailySummaryCardProps {
  summary: DailySummary;
  goal: DailyGoal;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ summary, goal }) => {
  const isEmpty = summary.entries.length === 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-widest">Resumen diario</h2>
          <p className="text-xs text-dark-600 mt-0.5">Objetivo: {goal.calories.toLocaleString()} kcal</p>
        </div>
        {isEmpty && (
          <span className="text-xs bg-dark-800 text-dark-500 rounded-full px-3 py-1 border border-dark-700">
            Sin registros hoy
          </span>
        )}
      </div>

      {/* Macros grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MacroPill
          label="Calorías"
          value={summary.total_calories}
          unit="kcal"
          color="bg-orange-500/10 border border-orange-500/20"
          textColor="text-orange-400"
        />
        <MacroPill
          label="Proteínas"
          value={summary.total_protein_g}
          color="bg-blue-500/10 border border-blue-500/20"
          textColor="text-blue-400"
        />
        <MacroPill
          label="Carbohidratos"
          value={summary.total_carbs_g}
          color="bg-emerald-500/10 border border-emerald-500/20"
          textColor="text-emerald-400"
        />
        <MacroPill
          label="Grasas"
          value={summary.total_fat_g}
          color="bg-yellow-500/10 border border-yellow-500/20"
          textColor="text-yellow-400"
        />
      </div>

      {/* Progress bar */}
      <ProgressBar current={summary.total_calories} goal={goal.calories} />

      {/* Macro progress bars */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Proteínas', val: summary.total_protein_g, goal: goal.protein_g, color: 'bg-blue-500' },
          { label: 'Carbohidratos', val: summary.total_carbs_g, goal: goal.carbs_g, color: 'bg-emerald-500' },
          { label: 'Grasas', val: summary.total_fat_g, goal: goal.fat_g, color: 'bg-yellow-500' },
        ].map(({ label, val, goal: g, color }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-dark-400">{label}</span>
              <span className="text-dark-500">{Math.round(val)}/{g}g</span>
            </div>
            <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min((val / Math.max(g, 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
