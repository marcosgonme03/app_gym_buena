import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayNutritionPlan, type NutritionPlanData } from '@/services/nutritionPlans';

export const NutritionPlanCard: React.FC = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<NutritionPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayNutritionPlan()
      .then(data => setPlan(data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  const FALLBACK = { breakfast: 'Avena y Frutas', lunch: 'Pollo con Arroz', dinner: 'Ensalada y Salmón' };
  const p = plan ?? FALLBACK;
  const isRealData = !!plan;

  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 animate-pulse space-y-3">
        <div className="h-5 w-36 bg-dark-800 rounded" />
        <div className="h-20 bg-dark-800 rounded" />
        <div className="h-9 bg-dark-800 rounded" />
      </div>
    );
  }

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
        <div className="absolute inset-0 px-5 flex items-center">
          <div>
            <p className="text-[10px] text-primary-400 uppercase tracking-widest font-semibold">Hoy</p>
            <h2 className="text-base font-bold text-dark-50">Plan Nutricional</h2>
          </div>
          {!isRealData && (
            <span className="text-[9px] bg-dark-700/80 text-dark-500 px-2 py-0.5 rounded-full ml-2">ejemplo</span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-1">
          {[
            { icon: '☀️', label: 'Desayuno', value: p.breakfast },
            { icon: '🍴', label: 'Almuerzo', value: p.lunch },
            { icon: '🌙', label: 'Cena',     value: p.dinner },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2.5 border-b border-dark-800 last:border-0">
              <span className="text-base flex-shrink-0 w-7 text-center">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-dark-600 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                <p className="text-sm text-dark-200 truncate font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/app/nutrition')}
          className="mt-4 w-full py-2.5 border border-primary-500/30 text-primary-400 text-xs font-bold rounded-xl hover:bg-primary-500/10 hover:border-primary-500/60 transition-all duration-200 uppercase tracking-widest"
        >
          Ver plan completo
        </button>
      </div>
    </div>
  );
};
