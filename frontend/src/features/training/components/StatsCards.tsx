// ============================================================================
// StatsCards — Tarjetas de estadísticas del módulo de entrenamientos
// ============================================================================

import React from 'react';
import type { WorkoutStats } from '../types';

interface StatsCardsProps {
  stats:   WorkoutStats;
  loading: boolean;
}

interface CardProps {
  label:    string;
  value:    string | number;
  sub?:     string;
  icon:     React.ReactNode;
  accent:   string;   // Tailwind color class
  loading?: boolean;
}

function StatCard({ label, value, sub, icon, accent, loading }: CardProps) {
  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-dark-700">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-16 bg-dark-800 rounded-lg" />
          <div className="h-3 w-24 bg-dark-800 rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-black text-dark-50 tracking-tight tabular-nums">{value}</p>
          <div>
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">{label}</p>
            {sub && <p className="text-xs text-dark-600 mt-0.5">{sub}</p>}
          </div>
        </>
      )}
    </div>
  );
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  const formatWeight = (kg: number) =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Este mes"
        value={stats.this_month_sessions}
        sub="sesiones completadas"
        accent="bg-primary-500/10 text-primary-400"
        loading={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        }
      />
      <StatCard
        label="Esta semana"
        value={stats.this_week_sessions}
        sub="sesiones completadas"
        accent="bg-blue-500/10 text-blue-400"
        loading={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        }
      />
      <StatCard
        label="Peso total"
        value={formatWeight(stats.total_weight_kg)}
        sub="kg levantados histórico"
        accent="bg-purple-500/10 text-purple-400"
        loading={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5h16.5M3.75 13.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 013.75 3.75h16.5A2.25 2.25 0 0122.5 6v5.25a2.25 2.25 0 01-2.25 2.25" />
          </svg>
        }
      />
      <StatCard
        label="Duración media"
        value={stats.avg_duration_min ? `${Math.round(stats.avg_duration_min)} min` : '—'}
        sub={`${stats.total_sessions} sesiones totales`}
        accent="bg-teal-500/10 text-teal-400"
        loading={loading}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
};
