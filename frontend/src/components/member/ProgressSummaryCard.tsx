import React from 'react';

interface ProgressSummaryCardProps {
  weeklyCount?: number;
  totalWeightKg?: number;
  weeklyGoal?: number;
  loading?: boolean;
}

const STRIP_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=250&q=70',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=250&q=70',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=250&q=70',
];

export const ProgressSummaryCard: React.FC<ProgressSummaryCardProps> = ({
  weeklyCount = 0,
  totalWeightKg = 0,
  weeklyGoal = 3,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden animate-pulse">
        <div className="p-6 space-y-5">
          <div className="h-5 w-28 bg-dark-800 rounded" />
          <div className="h-3 w-20 bg-dark-800 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-dark-800 rounded" />
            <div className="h-16 bg-dark-800 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 h-20">
          {[0,1,2].map(i => <div key={i} className="bg-dark-800" />)}
        </div>
      </div>
    );
  }

  const progressPct = weeklyGoal > 0 ? Math.min(Math.round((weeklyCount / weeklyGoal) * 100), 100) : 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-dark-50">Tu Progreso</h2>
            <p className="text-xs text-dark-500 mt-0.5">Ãšltima Semana</p>
          </div>
          {progressPct > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {progressPct}%
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-5">
          {/* Entrenamientos */}
          <div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-4xl font-black text-dark-50">{weeklyCount}</span>
            </div>
            <p className="text-xs text-dark-400 mt-2 font-medium">Entrenamientos</p>
            {/* mini bar */}
            <div className="mt-2 w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-dark-600 mt-1">meta: {weeklyGoal}/semana</p>
          </div>

          {/* Peso Total */}
          <div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-4xl font-black text-dark-50">
                {totalWeightKg > 0 ? totalWeightKg.toLocaleString('es-ES') : 'â€”'}
              </span>
              {totalWeightKg > 0 && (
                <span className="text-sm text-dark-500 font-bold">kg</span>
              )}
            </div>
            <p className="text-xs text-dark-400 mt-2 font-medium">Peso Total</p>
            {/* mini bar */}
            <div className="mt-2 w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-700"
                style={{ width: totalWeightKg > 0 ? '80%' : '0%' }}
              />
            </div>
            <p className="text-[10px] text-dark-600 mt-1">
              {totalWeightKg > 0 ? 'esta semana' : 'sin datos aÃºn'}
            </p>
          </div>
        </div>
      </div>

      {/* Image strip */}
      <div className="grid grid-cols-3 h-[72px] overflow-hidden border-t border-dark-800">
        {STRIP_IMAGES.map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover opacity-50 hover:opacity-70 transition-opacity duration-200"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-dark-900/30" />
          </div>
        ))}
      </div>
    </div>
  );
};
