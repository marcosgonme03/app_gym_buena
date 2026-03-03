import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface Challenge {
  name: string;
  description: string;
  totalDays: number;
  completedDays: number;
}

interface ChallengeCardProps {
  challenge?: Challenge | null;
  loading?: boolean;
}

const FALLBACK: Challenge = {
  name: 'Abs Challenge',
  description: 'Reto de 30 Días',
  totalDays: 30,
  completedDays: 20,
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, loading }) => {
  const navigate = useNavigate();
  const c = challenge ?? FALLBACK;
  const pct = Math.round((c.completedDays / Math.max(c.totalDays, 1)) * 100);

  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 animate-pulse space-y-3">
        <div className="h-5 w-28 bg-dark-800 rounded" />
        <div className="h-20 bg-dark-800 rounded" />
        <div className="h-2  bg-dark-800 rounded" />
        <div className="h-9  bg-dark-800 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
      {/* Header with image */}
      <div className="relative h-20 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80"
          alt="Desafío"
          className="w-full h-full object-cover opacity-30"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/90 to-dark-900/40" />
        <div className="absolute inset-0 px-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-dark-500 uppercase tracking-widest font-semibold">Reto en curso</p>
            <h2 className="text-base font-bold text-dark-50">{c.name}</h2>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Activo
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs text-dark-500 mb-3">{c.description}</p>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-400 font-medium">{c.completedDays} / {c.totalDays} días</span>
            <span className="text-sm font-black text-primary-400">{pct}%</span>
          </div>
          <div className="w-full bg-dark-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-700 relative"
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/challenges')}
          className="w-full py-2.5 border border-primary-500/30 text-primary-400 text-xs font-bold rounded-xl hover:bg-primary-500/10 hover:border-primary-500/60 transition-all duration-200 uppercase tracking-widest"
        >
          Ver desafío
        </button>
      </div>
    </div>
  );
};
