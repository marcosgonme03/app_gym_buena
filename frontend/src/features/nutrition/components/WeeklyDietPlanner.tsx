// ============================================================================
// WeeklyDietPlanner — Grid 7 días × 4 comidas para editar el plan semanal
// ============================================================================

import React from 'react';
import type { DietPlanItem, DayOfWeek, MealType } from '../types';
import { DAY_NAMES, DAY_OF_WEEK_LIST, MEAL_TYPES } from '../types';
import { WeeklyMealEditor } from './WeeklyMealEditor';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const WeeklyDietPlannerSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
    {DAY_OF_WEEK_LIST.map(d => (
      <div key={d} className="bg-dark-900 border border-dark-800 rounded-2xl p-4 animate-pulse space-y-3">
        <div className="h-4 w-16 bg-dark-800 rounded" />
        {MEAL_TYPES.map(m => (
          <div key={m} className="space-y-1.5">
            <div className="h-3 w-20 bg-dark-800 rounded" />
            <div className="h-8 w-full bg-dark-800/60 rounded-lg" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

// ─── Day totals banner ────────────────────────────────────────────────────────

interface DayTotalsBannerProps {
  items: DietPlanItem[];
  isToday: boolean;
}

const DayTotalsBanner: React.FC<DayTotalsBannerProps> = ({ items, isToday }) => {
  if (items.length === 0) return null;
  const kcal = items.reduce((s, i) => s + i.calories,  0);
  const prot = items.reduce((s, i) => s + i.protein_g, 0);
  return (
    <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[10px] mt-2 ${
      isToday ? 'bg-primary-500/10 border border-primary-500/20 text-primary-400' : 'bg-dark-800/50 text-dark-500'
    }`}>
      <span>{Math.round(kcal)} kcal</span>
      <span>{Math.round(prot)}g P</span>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface WeeklyDietPlannerProps {
  plan: Record<DayOfWeek, DietPlanItem[]>;
  onItemsChange: (dayOfWeek: DayOfWeek, mealType: MealType, items: DietPlanItem[]) => void;
}

export const WeeklyDietPlanner: React.FC<WeeklyDietPlannerProps> = ({ plan, onItemsChange }) => {
  // Today's day_of_week  (ISO DOW - 1, so Mon=0..Sun=6)
  const todayDow = ((new Date().getDay() + 6) % 7) as DayOfWeek;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {DAY_OF_WEEK_LIST.map(dow => {
        const isToday   = dow === todayDow;
        const dayItems  = plan[dow] ?? [];

        return (
          <div
            key={dow}
            className={`rounded-2xl p-4 space-y-3 border transition-all ${
              isToday
                ? 'bg-primary-500/5 border-primary-500/30'
                : 'bg-dark-900 border-dark-800'
            }`}
          >
            {/* Day header */}
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-black uppercase tracking-widest ${
                isToday ? 'text-primary-400' : 'text-dark-400'
              }`}>
                {DAY_NAMES[dow]}
              </h3>
              {isToday && (
                <span className="text-[9px] font-bold bg-primary-500/20 text-primary-400 rounded-full px-1.5 py-0.5 border border-primary-500/30">
                  HOY
                </span>
              )}
            </div>

            {/* Meals */}
            <div className="space-y-3 divide-y divide-dark-800/50">
              {MEAL_TYPES.map(meal => {
                const mealItems = dayItems.filter(i => i.meal_type === meal);
                return (
                  <div key={meal} className="pt-2 first:pt-0">
                    <WeeklyMealEditor
                      dayOfWeek={dow}
                      mealType={meal}
                      items={mealItems}
                      onItemsChange={onItemsChange}
                    />
                  </div>
                );
              })}
            </div>

            {/* Day totals */}
            <DayTotalsBanner items={dayItems} isToday={isToday} />
          </div>
        );
      })}
    </div>
  );
};
