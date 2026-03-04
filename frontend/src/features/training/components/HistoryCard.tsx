// ============================================================================
// HistoryCard — Tarjeta de item del historial
// ============================================================================

import React from 'react';
import type { HistoryItem } from '../types';

const CAT_STYLES: Record<string, { badge: string; dot: string }> = {
  fuerza:      { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     dot: 'bg-blue-400'     },
  hipertrofia: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
  cardio:      { badge: 'bg-red-500/10 text-red-400 border-red-500/20',         dot: 'bg-red-400'      },
  general:     { badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',      dot: 'bg-teal-400'     },
};

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface HistoryCardProps {
  item:        HistoryItem;
  onViewDetail: (item: HistoryItem) => void;
  onRepeat:     (item: HistoryItem) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ item, onViewDetail, onRepeat }) => {
  const cat = CAT_STYLES[item.category] ?? CAT_STYLES.general;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-dark-700 transition-all duration-200 group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark-100 truncate group-hover:text-white transition-colors">
            {item.session_name}
          </p>
          <p className="text-xs text-dark-500 mt-0.5">{formatDate(item.workout_date)}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cat.badge}`}>
          {item.category}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            v: item.actual_duration_min ? `${item.actual_duration_min} min` : '—',
            l: 'Duración',
          },
          {
            v: item.exercise_count || '—',
            l: 'Ejercicios',
          },
          {
            v: item.total_weight_kg ? `${item.total_weight_kg} kg` : '—',
            l: 'Volumen',
          },
        ].map(m => (
          <div key={m.l} className="bg-dark-800/50 rounded-xl px-2.5 py-2 text-center">
            <p className="text-sm font-bold text-dark-100 tabular-nums">{m.v}</p>
            <p className="text-[10px] text-dark-600 mt-0.5">{m.l}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onViewDetail(item)}
          className="flex-1 py-2 rounded-xl border border-dark-700 text-xs font-semibold text-dark-400 hover:text-dark-100 hover:border-dark-600 hover:bg-dark-800 transition-all duration-150"
        >
          Ver detalle
        </button>
        <button
          onClick={() => onRepeat(item)}
          className="flex-1 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-all duration-150"
        >
          ↩ Repetir
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
export const HistoryCardSkeleton: React.FC = () => (
  <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-1.5">
        <div className="h-4 w-36 bg-dark-800 rounded" />
        <div className="h-3 w-20 bg-dark-800 rounded" />
      </div>
      <div className="h-5 w-16 bg-dark-800 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[0,1,2].map(i => <div key={i} className="h-12 bg-dark-800 rounded-xl" />)}
    </div>
    <div className="flex gap-2 pt-1">
      <div className="flex-1 h-8 bg-dark-800 rounded-xl" />
      <div className="flex-1 h-8 bg-dark-800 rounded-xl" />
    </div>
  </div>
);
