import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayDiet } from '@/features/nutrition/services/nutritionService';
import type { TodayDietItem, MealType } from '@/features/nutrition/types';
import { MEAL_TYPES, MEAL_LABELS, MEAL_ICONS } from '@/features/nutrition/types';

export const NutritionPlanCard: React.FC = () => {
  const navigate = useNavigate();
  const [items,   setItems]   = useState<TodayDietItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayDiet()
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden animate-pulse">
        <div className="h-24 bg-dark-800" />
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 bg-dark-800 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 w-16 bg-dark-800 rounded" />
                <div className="h-3.5 w-32 bg-dark-800 rounded" />
              </div>
            </div>
          ))}
          <div className="h-9 bg-dark-800 rounded-xl mt-2" />
        </div>
      </div>
    );
  }

  // Group by meal — first item per meal for summary, total consumed
  const byMeal = MEAL_TYPES.reduce(
    (acc, m) => ({ ...acc, [m]: items.filter(i => i.meal_type === m) }),
    {} as Record<MealType, TodayDietItem[]>,
  );
  const mealsWithItems = MEAL_TYPES.filter(m => byMeal[m].length > 0);
  const totalConsumed  = items.filter(i => i.consumed).length;
  const totalItems     = items.length;
  const hasPlan        = totalItems > 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
      {/* Banner image */}
      <div className="relative h-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"
          alt="Plan nutricional"
          className="w-full h-full object-cover opacity-40"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 to-transparent" />
        <div className="absolute inset-0 px-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-primary-400 uppercase tracking-widest font-semibold">Hoy</p>
            <h2 className="text-base font-bold text-dark-50">Plan Nutricional</h2>
          </div>
          {hasPlan && (
            <div className="flex items-center gap-1.5 bg-dark-900/70 px-2.5 py-1 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">
                {totalConsumed}/{totalItems}
              </span>
            </div>
          )}
          {!hasPlan && (
            <span className="text-[9px] bg-dark-700/80 text-dark-500 px-2 py-0.5 rounded-full">sin plan</span>
          )}
        </div>
      </div>

      <div className="p-5">
        {!hasPlan ? (
          <div className="py-4 text-center space-y-3">
            <p className="text-xs text-dark-500">No hay dieta planificada para hoy.</p>
            <button
              onClick={() => navigate('/app/nutrition/plan')}
              className="w-full py-2.5 border border-primary-500/30 text-primary-400 text-xs font-bold rounded-xl hover:bg-primary-500/10 transition-all uppercase tracking-widest"
            >
              Crear plan semanal
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-0.5">
              {mealsWithItems.map(meal => {
                const mealItems = byMeal[meal];
                const consumed  = mealItems.filter(i => i.consumed).length;
                const label     = mealItems.length === 1
                  ? mealItems[0].food_name
                  : `${mealItems[0].food_name}${mealItems.length > 1 ? ` +${mealItems.length - 1}` : ''}`;
                const allDone = consumed === mealItems.length;
                return (
                  <div key={meal} className="flex items-center gap-3 py-2.5 border-b border-dark-800 last:border-0">
                    <span className={`text-base flex-shrink-0 w-7 text-center transition-all ${
                      allDone ? 'opacity-40' : ''
                    }`}>{MEAL_ICONS[meal]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-dark-600 uppercase tracking-wide font-semibold mb-0.5">{MEAL_LABELS[meal]}</p>
                      <p className={`text-sm font-medium truncate transition-all ${
                        allDone ? 'text-dark-500 line-through' : 'text-dark-200'
                      }`}>
                        {label}
                      </p>
                    </div>
                    {allDone && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-emerald-400 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {!allDone && consumed > 0 && (
                      <span className="text-[10px] text-dark-600 flex-shrink-0">{consumed}/{mealItems.length}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/app/nutrition')}
              className="mt-4 w-full py-2.5 border border-primary-500/30 text-primary-400 text-xs font-bold rounded-xl hover:bg-primary-500/10 hover:border-primary-500/60 transition-all duration-200 uppercase tracking-widest"
            >
              Ver plan completo
            </button>
          </>
        )}
      </div>
    </div>
  );
};
