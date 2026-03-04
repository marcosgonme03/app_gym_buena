// ============================================================================
// ProgresoPage — Módulo completo de Progreso
// Ruta: /app/progress
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TopNav } from '@/components/layout/TopNav';
import { loadAllProgressData } from '../services/progressService';
import type { ProgressData } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  fuerza:      'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  hipertrofia: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  cardio:      'bg-red-500/15 text-red-400 border border-red-500/20',
  general:     'bg-teal-500/15 text-teal-400 border border-teal-500/20',
};

const TROPHY_ICONS = [
  // Gold
  <svg key="gold" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
  </svg>,
  // Silver
  <svg key="silver" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-300">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
  </svg>,
  // Bronze
  <svg key="bronze" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-400">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
  </svg>,
  // 4th — dumbbell icon
  <svg key="dumbbell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-dark-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
  </svg>,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')} t`;
  return `${Math.round(kg).toLocaleString('es-ES')} kg`;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function relativeDay(iso: string): string {
  const today = new Date().toISOString().split('T')[0];
  const diff  = Math.round(
    (new Date(today + 'T00:00:00').getTime() - new Date(iso + 'T00:00:00').getTime())
    / 86400000,
  );
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7)   return `${diff} días atrás`;
  if (diff < 14)  return '1 semana atrás';
  return `${Math.floor(diff / 7)} semanas atrás`;
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

const StatSkeleton = () => (
  <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-dark-800" />
      <div className="h-8 w-24 bg-dark-800 rounded-lg" />
    </div>
    <div className="h-3 w-32 bg-dark-800 rounded" />
    <div className="h-3 w-20 bg-dark-800 rounded" />
  </div>
);

const RecordSkeleton = () => (
  <div className="flex items-center gap-3 py-3 animate-pulse">
    <div className="w-5 h-5 rounded-full bg-dark-800 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 w-28 bg-dark-800 rounded" />
      <div className="h-3 w-16 bg-dark-800 rounded" />
    </div>
    <div className="h-5 w-14 bg-dark-800 rounded" />
  </div>
);

const ChartSkeleton = () => (
  <div className="animate-pulse space-y-3 py-6">
    <div className="flex items-end gap-2 h-48 px-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-dark-800 rounded-t"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
    <div className="flex gap-6 justify-center">
      <div className="h-3 w-20 bg-dark-800 rounded" />
      <div className="h-3 w-20 bg-dark-800 rounded" />
    </div>
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-dark-400 mb-2 font-semibold">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-medium" style={{ color: entry.color }}>
          {entry.name === 'Kg Movidos' && fmtWeight(entry.value)}
          {entry.name === 'Sesiones' && `${entry.value} sesión${entry.value !== 1 ? 'es' : ''}`}
        </p>
      ))}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 text-dark-700 mb-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
    <p className="text-dark-500 text-sm">{message}</p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ProgresoPage: React.FC = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadAllProgressData();
      setData(result);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err.message || 'No se pudo cargar el progreso');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats    = data?.stats;
  const records  = data?.records ?? [];
  const frequent = data?.mostFrequent;
  const evol     = data?.evolution ?? [];
  const recent   = data?.recentSessions ?? [];

  // Check if chart has any real data
  const hasChartData = evol.some(p => p.session_count > 0);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-dark-50 tracking-tight">Tu Progreso</h1>
            <p className="text-sm text-dark-500 mt-1">Evolución, récords y estadísticas de tus entrenamientos</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-sm font-semibold text-dark-300 hover:text-dark-100 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Sesiones totales */}
              {loading ? <StatSkeleton /> : (
                <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                      </svg>
                    </div>
                    <span className="text-4xl font-black text-dark-50 tabular-nums tracking-tight">
                      {stats?.total_sessions ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-dark-500 mb-1">
                    {stats?.this_month_sessions ?? 0} completadas · {stats?.months_active ?? 0} meses
                    {(stats?.this_month_sessions ?? 0) > 0 && (
                      <span className="ml-2 text-green-400">↑+{stats!.this_month_sessions}</span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Total sesiones</p>
                </div>
              )}

              {/* Peso total */}
              {loading ? <StatSkeleton /> : (
                <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                      </svg>
                    </div>
                    <span className="text-3xl font-black text-dark-50 tabular-nums tracking-tight">
                      {fmtWeight(stats?.total_weight_kg ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-dark-500 mb-0.5">
                    Este mes
                    {(stats?.this_week_sessions ?? 0) > 0 && (
                      <span className="ml-2 text-green-400">↑+{stats!.this_week_sessions}</span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Peso total movido</p>
                </div>
              )}

              {/* Duración media */}
              {loading ? <StatSkeleton /> : (
                <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-4xl font-black text-dark-50 tabular-nums tracking-tight">
                      {stats?.avg_duration_min != null ? `${Math.round(stats.avg_duration_min)}` : '--'}
                      <span className="text-lg text-dark-400 font-normal ml-1">min</span>
                    </span>
                  </div>
                  <p className="text-xs text-dark-500 mb-0.5">
                    {stats?.this_week_sessions ?? 0} sesiones esta semana
                  </p>
                  <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Duración media</p>
                </div>
              )}
            </div>

            {/* ── Gráfico Evolución ─────────────────────────────────────── */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-dark-50">Evolución de Entrenamientos</h2>
                  <p className="text-xs text-dark-500 mt-0.5">Últimas 12 semanas</p>
                </div>
                <button
                  onClick={() => navigate('/app/workout/historial')}
                  className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1"
                >
                  Ver historial completo
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <ChartSkeleton />
              ) : !hasChartData ? (
                <EmptyState message="Completa tus primeras sesiones para ver tu evolución" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart
                    data={evol}
                    margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis
                      dataKey="week_label"
                      tick={{ fill: '#52525b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="weight"
                      orientation="left"
                      tick={{ fill: '#52525b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                      width={40}
                    />
                    <YAxis
                      yAxisId="sessions"
                      orientation="right"
                      tick={{ fill: '#52525b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={30}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3f3f5c', strokeWidth: 1 }} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                      formatter={(value) => (
                        <span style={{ color: '#a1a1aa' }}>{value}</span>
                      )}
                    />
                    <Area
                      yAxisId="weight"
                      type="monotone"
                      dataKey="total_weight_kg"
                      name="Kg Movidos"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorWeight)"
                      dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#818cf8' }}
                    />
                    <Line
                      yAxisId="sessions"
                      type="monotone"
                      dataKey="session_count"
                      name="Sesiones"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#a5b4fc' }}
                      strokeDasharray="4 2"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Progreso Reciente ──────────────────────────────────────── */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 lg:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-dark-50">Progreso Reciente</h2>
                <button
                  onClick={() => navigate('/app/workout/historial')}
                  className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1"
                >
                  Ver todo
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="divide-y divide-dark-800 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3.5">
                      <div className="w-8 h-8 rounded-lg bg-dark-800 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 bg-dark-800 rounded" />
                        <div className="h-3 w-20 bg-dark-800 rounded" />
                      </div>
                      <div className="text-right space-y-1.5">
                        <div className="h-3 w-12 bg-dark-800 rounded" />
                        <div className="h-3 w-16 bg-dark-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <EmptyState message="Completa tu primera sesión para ver tu progreso reciente" />
              ) : (
                <div className="divide-y divide-dark-800/50">
                  {recent.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/app/workout/sesion/${session.id}`)}
                      className="w-full flex items-center gap-4 py-3.5 hover:bg-dark-800/30 -mx-1 px-1 rounded-xl transition-colors group text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0 group-hover:bg-dark-700 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-dark-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-100 group-hover:text-dark-50 transition-colors truncate">
                          {session.session_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${CAT_COLORS[session.category] ?? CAT_COLORS.general}`}>
                            {session.category}
                          </span>
                          <span className="text-xs text-dark-500">{relativeDay(session.workout_date)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {session.exercise_count > 0 && (
                          <p className="text-sm font-bold text-dark-200">
                            {session.exercise_count} <span className="text-dark-500 font-normal text-xs">ejercicios</span>
                          </p>
                        )}
                        {session.total_weight_kg != null && session.total_weight_kg > 0 && (
                          <p className="text-xs text-dark-500">
                            {fmtWeight(session.total_weight_kg)}
                          </p>
                        )}
                      </div>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dark-700 group-hover:text-dark-500 flex-shrink-0 transition-colors">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ──────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Récords Personales */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-yellow-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
                <h2 className="text-base font-bold text-dark-50">Récords Personales</h2>
              </div>

              {loading ? (
                <div>
                  {Array.from({ length: 4 }).map((_, i) => <RecordSkeleton key={i} />)}
                </div>
              ) : records.length === 0 ? (
                <EmptyState message="Registra ejercicios con peso para ver tus récords" />
              ) : (
                <div className="divide-y divide-dark-800/40">
                  {records.map((rec, idx) => (
                    <button
                      key={rec.exercise_name}
                      onClick={() => navigate(`/app/workout/historial?exercise=${encodeURIComponent(rec.exercise_name)}`)}
                      className="w-full flex items-center gap-3 py-3.5 hover:bg-dark-800/30 -mx-1 px-1 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex-shrink-0 w-7 flex items-center justify-center">
                        {TROPHY_ICONS[Math.min(idx, 3)]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-100 group-hover:text-dark-50 transition-colors truncate">
                          {rec.exercise_name}
                        </p>
                        <p className="text-xs text-dark-500 mt-0.5">{fmtDate(rec.date)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-black text-dark-50">
                          {rec.max_weight_kg}
                          <span className="text-xs text-dark-500 font-normal ml-0.5">kg</span>
                        </span>
                        <p className="text-xs text-dark-600">
                          {rec.total_exercises} Ej{rec.total_exercises !== 1 ? 'ercicios' : 'ercicio'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ejercicio más frecuente */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-primary-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <h2 className="text-base font-bold text-dark-50">Ejercicio más frecuente</h2>
              </div>

              {loading ? (
                <div className="animate-pulse flex items-center gap-4 p-3 bg-dark-800/50 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-dark-700" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-dark-700 rounded" />
                    <div className="h-3 w-16 bg-dark-700 rounded" />
                  </div>
                </div>
              ) : !frequent ? (
                <EmptyState message="Registra ejercicios para ver estadísticas" />
              ) : (
                <div className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-primary-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-dark-100 truncate">{frequent.exercise_name}</p>
                    <p className="text-xs text-dark-500 mt-0.5">
                      x <span className="font-semibold text-primary-400">{frequent.total_times}</span> veces
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 space-y-2">
              <h2 className="text-base font-bold text-dark-50 mb-4">Accesos rápidos</h2>
              {[
                { label: 'Ir a entrenamientos',  path: '/app/workout',            icon: 'M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3' },
                { label: 'Historial completo',   path: '/app/workout/historial',   icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Configurar plan',       path: '/app/workout/plan-semanal', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              ].map(({ label, path, icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-transparent hover:border-dark-700 text-sm font-medium text-dark-300 hover:text-dark-100 transition-all group"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  {label}
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-dark-700 group-hover:text-dark-500 ml-auto transition-colors">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
