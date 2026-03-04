import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminStatCard } from '../components/AdminStatCard';
import {
  GrowthLineChart, WeeklyBarChart, MultiLineChart,
  DailyActivityChart, MacroPieChart, HorizontalBarChart,
  FunnelChart, RetentionChart, WeightProgressChart,
} from '../components/AdminChart';
import {
  getUserGrowthChart, getWeeklySessionsChart, getWeeklyActivity,
  getDailyActivity, getExerciseFrequency, getNutritionAnalytics,
  getAdminStats, getRetentionStats, getActivityFunnel,
  getWeightProgressChart, getTopActiveUsers, getTopUsersByWeight,
} from '../services/adminService';
import { AdminTable } from '../components/AdminTable';
import type { AdminTableColumn } from '../components/AdminTable';
import { Avatar } from '@/components/common/Avatar';
import type {
  ChartDataPoint, WeeklyActivityPoint, DailyActivityPoint,
  ExerciseFrequency, MacroDistribution, AdminStats,
  RetentionStats, FunnelStep, WeightProgressPoint, TopUser,
} from '../types/adminTypes';

const SkeletonChart = ({ height = 260 }: { height?: number }) => (
  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 animate-pulse">
    <div className="h-4 bg-dark-700 rounded w-40 mb-4" />
    <div style={{ height }} className="bg-dark-800 rounded-lg" />
  </div>
);
const SkeletonCard = () => (
  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 animate-pulse">
    <div className="w-10 h-10 bg-dark-700 rounded-lg mb-4" />
    <div className="h-7 bg-dark-700 rounded w-24 mb-2" />
    <div className="h-3 bg-dark-800 rounded w-32" />
  </div>
);

const weightRankCols: AdminTableColumn<TopUser>[] = [
  {
    key: '_idx', header: '#', width: 'w-10',
    render: (_, idx) => (
      <span className={`text-sm font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-dark-600'}`}>
        {(idx ?? 0) + 1}
      </span>
    ),
  },
  {
    key: 'name', header: 'Usuario',
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <Avatar src={row.avatar_url || undefined} name={`${row.name} ${row.last_name}`} size="sm" />
        <div>
          <p className="text-dark-100 font-medium text-sm">{row.name} {row.last_name}</p>
          <p className="text-xs text-dark-500">{row.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'sessions', header: 'Sesiones', width: 'w-24', render: (row) => <span className="text-cyan-400 font-semibold">{row.sessions}</span> },
  {
    key: 'totalWeightKg', header: 'Peso total', width: 'w-32',
    render: (row) => <span className="text-orange-400 font-bold">{row.totalWeightKg.toLocaleString('es-ES')} kg</span>,
  },
];

export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [growth, setGrowth]         = useState<ChartDataPoint[]>([]);
  const [weekly, setWeekly]         = useState<ChartDataPoint[]>([]);
  const [activity, setActivity]     = useState<WeeklyActivityPoint[]>([]);
  const [daily, setDaily]           = useState<DailyActivityPoint[]>([]);
  const [exercises, setExercises]   = useState<ExerciseFrequency[]>([]);
  const [macroData, setMacroData]   = useState<MacroDistribution[]>([]);
  const [weeklyKcal, setWeeklyKcal] = useState<ChartDataPoint[]>([]);
  const [retention, setRetention]   = useState<RetentionStats | null>(null);
  const [funnel, setFunnel]         = useState<FunnelStep[]>([]);
  const [weightProg, setWeightProg] = useState<WeightProgressPoint[]>([]);
  const [topActive, setTopActive]   = useState<TopUser[]>([]);
  const [topWeight, setTopWeight]   = useState<TopUser[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getUserGrowthChart(),
      getWeeklySessionsChart(),
      getWeeklyActivity(),
      getDailyActivity(),
      getExerciseFrequency(10),
      getNutritionAnalytics(),
      getRetentionStats(),
      getActivityFunnel(),
      getWeightProgressChart(),
      getTopActiveUsers(8),
      getTopUsersByWeight(8),
    ]).then(([s, g, w, a, d, ex, na, ret, fu, wp, ta, tw]) => {
      setStats(s);
      setGrowth(g); setWeekly(w); setActivity(a); setDaily(d);
      setExercises(ex);
      setWeeklyKcal(na.weeklyNutrition);
      const { totalProtein, totalCarbs, totalFat } = na.macroStats;
      setMacroData([
        { name: 'Proteína',       value: totalProtein, color: '#3b82f6' },
        { name: 'Carbohidratos',  value: totalCarbs,   color: '#f97316' },
        { name: 'Grasas',         value: totalFat,     color: '#eab308' },
      ]);
      setRetention(ret);
      setFunnel(fu);
      setWeightProg(wp);
      setTopActive(ta);
      setTopWeight(tw);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const completionRate = stats && stats.totalWorkoutSessions > 0
    ? Math.round((stats.completedSessions / stats.totalWorkoutSessions) * 100) : 0;
  const userTrend = stats
    ? Math.round(((stats.newUsersThisWeek - stats.newUsersLastWeek) / (stats.newUsersLastWeek || 1)) * 100) : 0;

  return (
    <AdminLayout title="Analíticas" subtitle="Métricas avanzadas, retención y engagement de la plataforma">

      {/* ── GLOBAL METRICS ──────────────────────────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">MÉTRICAS GLOBALES</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : stats && (
          <>
            <AdminStatCard title="Total usuarios" value={stats.totalUsers}
              trend={{ value: userTrend, label: 'vs semana anterior' }} color="blue"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} />
            <AdminStatCard title="Usuarios activos" value={stats.activeUsersThisMonth} subtitle="Últimos 30 días" color="green"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
            <AdminStatCard title="Tasa completación" value={`${completionRate}%`} subtitle="Sesiones completadas" color="teal"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7"/></svg>} />
            <AdminStatCard title="Media sesiones/usuario" value={stats.avgWorkoutsPerUser.toFixed(1)} color="purple"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>} />
          </>
        )}
      </div>

      {/* ── USER GROWTH ─────────────────────────────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">CRECIMIENTO</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {loading ? <><SkeletonChart /><SkeletonChart /></> : (
          <>
            <GrowthLineChart title="Crecimiento acumulado de usuarios" subtitle="Últimos 6 meses" data={growth} />
            <WeeklyBarChart title="Sesiones semanales completadas" subtitle="Últimas 8 semanas" data={weekly} />
          </>
        )}
      </div>

      {/* ── ACTIVIDAD ───────────────────────────────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3 mt-2">ACTIVIDAD</p>
      <div className="mb-4">
        {loading ? <SkeletonChart height={240} /> : (
          <DailyActivityChart title="Actividad diaria" subtitle="Últimos 14 días — sesiones y registros nutricionales" data={daily} />
        )}
      </div>
      <div className="mb-6">
        {loading ? <SkeletonChart height={300} /> : (
          <MultiLineChart title="Actividad semanal detallada" subtitle="Sesiones y nuevos usuarios por semana" data={activity} height={300} />
        )}
      </div>

      {/* ── USER ENGAGEMENT: RETENCIÓN + FUNNEL ─────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">USER ENGAGEMENT</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {loading ? <><SkeletonChart height={220} /><SkeletonChart height={220} /></> : (
          <>
            {retention && (
              <RetentionChart
                title="Retención de usuarios"
                subtitle="% de usuarios que vuelven a entrenar después de su primera sesión"
                data={retention}
                height={220}
              />
            )}
            <FunnelChart
              title="Funnel de actividad"
              subtitle="Usuarios registrados → rutinas → sesiones completadas → nutrición"
              data={funnel}
            />
          </>
        )}
      </div>

      {/* ── WORKOUT ANALYTICS ───────────────────────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">WORKOUT ANALYTICS</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {loading ? <><SkeletonChart height={280} /><SkeletonChart height={280} /></> : (
          <>
            <HorizontalBarChart
              title="Ejercicios más frecuentes"
              subtitle="Top 10 por número de usos"
              data={exercises.map(e => ({ label: e.exercise_name, value: e.count }))}
              height={280}
            />
            <WeightProgressChart
              title="Progreso global de peso levantado"
              subtitle="Suma de kg de sesiones completadas por semana"
              data={weightProg}
              height={280}
            />
          </>
        )}
      </div>

      {/* ── NUTRITION ANALYTICS ─────────────────────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3 mt-2">NUTRITION ANALYTICS</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {loading ? <><SkeletonChart height={260} /><SkeletonChart height={260} /></> : (
          <>
            <MacroPieChart
              title="Distribución de macros"
              subtitle="Gramos totales registrados en la plataforma"
              data={macroData}
              height={260}
            />
            <WeeklyBarChart
              title="Calorías registradas por semana"
              subtitle="Últimas 8 semanas"
              data={weeklyKcal}
              label="Calorías"
              height={260}
            />
          </>
        )}
      </div>

      {/* ── RANKINGS ────────────────────────────────────────── */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">RANKINGS</p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-dark-900 border border-dark-800 rounded-xl">
          <div className="px-5 py-4 border-b border-dark-800">
            <h2 className="text-sm font-bold text-dark-100">Top usuarios más activos</h2>
            <p className="text-xs text-dark-500 mt-0.5">Por número de sesiones totales</p>
          </div>
          <AdminTable<TopUser>
            columns={weightRankCols}
            data={topActive}
            loading={loading}
            emptyMessage="Sin datos"
            keyExtractor={(u) => u.user_id}
            showIndex
          />
        </div>
        <div className="bg-dark-900 border border-dark-800 rounded-xl">
          <div className="px-5 py-4 border-b border-dark-800">
            <h2 className="text-sm font-bold text-dark-100">Top usuarios con más peso levantado</h2>
            <p className="text-xs text-dark-500 mt-0.5">Por kg totales en sesiones completadas</p>
          </div>
          <AdminTable<TopUser>
            columns={weightRankCols}
            data={topWeight}
            loading={loading}
            emptyMessage="Sin datos"
            keyExtractor={(u) => `w-${u.user_id}`}
            showIndex
          />
        </div>
      </div>

    </AdminLayout>
  );
};
