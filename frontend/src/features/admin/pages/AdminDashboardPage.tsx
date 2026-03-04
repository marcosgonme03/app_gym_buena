import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminTable } from '../components/AdminTable';
import type { AdminTableColumn } from '../components/AdminTable';
import {
  GrowthLineChart, WeeklyBarChart, MultiLineChart,
  DailyActivityChart, ActivityHeatmap,
} from '../components/AdminChart';
import { Avatar } from '@/components/common/Avatar';
import {
  getAdminStats, getUserGrowthChart, getWeeklySessionsChart, getWeeklyActivity,
  getTopActiveUsers, getRecentWorkouts, getRecentNutritionEntries, getDailyActivity,
  getActivityHeatmap, getPlatformAlerts,
} from '../services/adminService';
import type {
  AdminStats, ChartDataPoint, WeeklyActivityPoint,
  TopUser, AdminWorkoutSession, AdminNutritionEntry, DailyActivityPoint,
  HeatmapDay, PlatformAlert,
} from '../types/adminTypes';

const SkeletonCard = () => (
  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 animate-pulse">
    <div className="w-10 h-10 bg-dark-700 rounded-lg mb-4" />
    <div className="h-7 bg-dark-700 rounded w-24 mb-2" />
    <div className="h-3 bg-dark-800 rounded w-32" />
  </div>
);
const SkeletonChart = ({ height = 260 }: { height?: number }) => (
  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 animate-pulse">
    <div className="h-4 bg-dark-700 rounded w-40 mb-4" />
    <div style={{ height }} className="bg-dark-800 rounded-lg" />
  </div>
);

const ALERT_COLORS: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/8 text-red-400',
  warning:  'border-yellow-500/40 bg-yellow-500/8 text-yellow-400',
  info:     'border-green-500/40 bg-green-500/8 text-green-400',
};
const ALERT_ICONS: Record<string, string> = {
  critical: 'ðŸ”´', warning: 'âš ï¸', info: 'âœ…',
};
const STATUS_COLORS: Record<string, string> = {
  completed:   'bg-green-500/15 text-green-400',
  in_progress: 'bg-yellow-500/15 text-yellow-400',
  pending:     'bg-dark-700/50 text-dark-400',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'Completada', in_progress: 'En progreso', pending: 'Pendiente',
};
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'text-yellow-400', lunch: 'text-orange-400', dinner: 'text-blue-400', snack: 'text-green-400',
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Merienda',
};

const rankingsColumns: AdminTableColumn<TopUser>[] = [
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
  { key: 'completed', header: 'Completadas', width: 'w-28', render: (row) => <span className="text-green-400">{row.completed}</span> },
  { key: 'totalWeightKg', header: 'Peso total', width: 'w-28', render: (row) => <span className="text-dark-300">{row.totalWeightKg.toLocaleString('es-ES')} kg</span> },
];

const recentWorkoutColumns: AdminTableColumn<AdminWorkoutSession>[] = [
  {
    key: 'user_name', header: 'Usuario',
    render: (row) => (
      <div>
        <p className="text-dark-100 text-sm font-medium">{row.user_name}</p>
        <p className="text-xs text-dark-500">{row.user_email}</p>
      </div>
    ),
  },
  { key: 'session_name', header: 'SesiÃ³n', render: (row) => <span className="text-dark-300 text-sm">{row.session_name || 'â€”'}</span> },
  { key: 'workout_date', header: 'Fecha', width: 'w-24', render: (row) => <span className="text-dark-400 text-xs">{new Date(row.workout_date).toLocaleDateString('es-ES')}</span> },
  { key: 'total_weight_kg', header: 'Peso', width: 'w-20', render: (row) => <span className="text-dark-300 text-sm">{row.total_weight_kg ? `${Number(row.total_weight_kg).toFixed(0)} kg` : 'â€”'}</span> },
  {
    key: 'status', header: 'Estado', width: 'w-28',
    render: (row) => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] ?? STATUS_COLORS['pending']}`}>
        {STATUS_LABELS[row.status] ?? row.status}
      </span>
    ),
  },
];

const recentNutritionColumns: AdminTableColumn<AdminNutritionEntry>[] = [
  {
    key: 'user_name', header: 'Usuario',
    render: (row) => (
      <div>
        <p className="text-dark-100 text-sm font-medium">{row.user_name}</p>
        <p className="text-xs text-dark-500">{row.user_email}</p>
      </div>
    ),
  },
  { key: 'food_name', header: 'Alimento', render: (row) => <span className="text-dark-200 text-sm">{row.food_name}</span> },
  {
    key: 'meal_type', header: 'Comida', width: 'w-24',
    render: (row) => <span className={`text-xs font-medium ${MEAL_COLORS[row.meal_type] ?? 'text-dark-400'}`}>{MEAL_LABELS[row.meal_type] ?? row.meal_type}</span>,
  },
  { key: 'calories', header: 'Kcal', width: 'w-16', render: (row) => <span className="text-orange-400 font-semibold text-sm">{row.calories}</span> },
  { key: 'entry_date', header: 'Fecha', width: 'w-24', render: (row) => <span className="text-dark-400 text-xs">{new Date(row.entry_date).toLocaleDateString('es-ES')}</span> },
];

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [growth, setGrowth] = useState<ChartDataPoint[]>([]);
  const [weekly, setWeekly] = useState<ChartDataPoint[]>([]);
  const [activity, setActivity] = useState<WeeklyActivityPoint[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivityPoint[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<AdminWorkoutSession[]>([]);
  const [recentNutrition, setRecentNutrition] = useState<AdminNutritionEntry[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getUserGrowthChart(),
      getWeeklySessionsChart(),
      getWeeklyActivity(),
      getDailyActivity(),
      getTopActiveUsers(8),
      getRecentWorkouts(8),
      getRecentNutritionEntries(8),
      getActivityHeatmap(),
      getPlatformAlerts(),
    ]).then(([s, g, w, a, d, top, rw, rn, hm, al]) => {
      setStats(s); setGrowth(g); setWeekly(w); setActivity(a);
      setDailyActivity(d); setTopUsers(top);
      setRecentWorkouts(rw); setRecentNutrition(rn);
      setHeatmap(hm); setAlerts(al);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const userTrend = stats
    ? Math.round(((stats.newUsersThisWeek - stats.newUsersLastWeek) / (stats.newUsersLastWeek || 1)) * 100)
    : 0;
  const completionRate = stats && stats.totalWorkoutSessions > 0
    ? Math.round((stats.completedSessions / stats.totalWorkoutSessions) * 100)
    : 0;

  return (
    <AdminLayout title="Dashboard" subtitle="Resumen general de la plataforma">

      {/* â”€â”€ Alertas del sistema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {alerts.map((a) => (
            <div key={a.id} className={`border rounded-xl px-4 py-3 flex items-start gap-3 ${ALERT_COLORS[a.severity]}`}>
              <span className="text-base shrink-0 mt-0.5">{ALERT_ICONS[a.severity]}</span>
              <div>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ GLOBAL METRICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">MÃ‰TRICAS GLOBALES</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats && (
          <>
            <AdminStatCard title="Usuarios totales" value={stats.totalUsers}
              trend={{ value: userTrend, label: 'vs semana anterior' }} color="blue"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <AdminStatCard title="Activos hoy" value={stats.activeUsersToday}
              subtitle="Con sesiÃ³n registrada hoy" color="green"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <AdminStatCard title="Activos esta semana" value={stats.activeUsersThisWeek} color="teal"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
            <AdminStatCard title="Activos este mes" value={stats.activeUsersThisMonth}
              subtitle="Con sesiones en 30 dÃ­as" color="purple"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <AdminStatCard title="Sesiones totales" value={stats.totalWorkoutSessions} color="purple"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
            <AdminStatCard title="Sesiones completadas" value={stats.completedSessions}
              subtitle={`${completionRate}% tasa de Ã©xito`} color="teal"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>} />
            <AdminStatCard title="Peso total movido" value={`${stats.totalWeightKg.toLocaleString('es-ES')} kg`} color="orange"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} />
            <AdminStatCard title="Registros nutriciÃ³n" value={stats.totalNutritionEntries} color="red"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} />
            <AdminStatCard title="Media sesiones/usuario" value={stats.avgWorkoutsPerUser.toFixed(1)} color="blue"
              icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
          </>
        )}
      </div>

      {/* â”€â”€ USER GROWTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">CRECIMIENTO DE USUARIOS</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {loading ? <><SkeletonChart /><SkeletonChart /></> : (
          <>
            <GrowthLineChart title="Usuarios acumulados" subtitle="Ãšltimos 6 meses" data={growth} />
            <WeeklyBarChart title="Nuevas sesiones por semana" subtitle="Ãšltimas 8 semanas" data={weekly} />
          </>
        )}
      </div>

      {/* â”€â”€ ACTIVIDAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">ACTIVIDAD</p>
      <div className="mb-4">
        {loading ? <SkeletonChart height={240} /> : (
          <DailyActivityChart title="Actividad diaria" subtitle="Ãšltimos 14 dÃ­as â€” sesiones y registros nutricionales" data={dailyActivity} />
        )}
      </div>
      <div className="mb-6">
        {loading ? <SkeletonChart height={280} /> : (
          <MultiLineChart title="Actividad semanal detallada" subtitle="Sesiones y nuevos usuarios por semana" data={activity} height={280} />
        )}
      </div>

      {/* â”€â”€ USER ENGAGEMENT â€” HEATMAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">USER ENGAGEMENT</p>
      <div className="mb-6">
        {loading ? <SkeletonChart height={130} /> : (
          <ActivityHeatmap title="Heatmap de entrenamientos" subtitle="Ãšltimo aÃ±o â€” cada celda = 1 dÃ­a" data={heatmap} />
        )}
      </div>

      {/* â”€â”€ RANKINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">RANKINGS</p>
      <div className="bg-dark-900 border border-dark-800 rounded-xl mb-5">
        <div className="px-5 py-4 border-b border-dark-800">
          <h2 className="text-sm font-bold text-dark-100">Top usuarios mÃ¡s activos</h2>
          <p className="text-xs text-dark-500 mt-0.5">Ordenados por nÃºmero total de sesiones</p>
        </div>
        <AdminTable<TopUser>
          columns={rankingsColumns}
          data={topUsers}
          loading={loading}
          emptyMessage="Sin datos de ranking"
          keyExtractor={(u) => u.user_id}
          showIndex
        />
      </div>

      {/* â”€â”€ ACTIVIDAD RECIENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <p className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-3">ACTIVIDAD RECIENTE</p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-dark-900 border border-dark-800 rounded-xl">
          <div className="px-5 py-4 border-b border-dark-800">
            <h2 className="text-sm font-bold text-dark-100">Ãšltimos entrenamientos</h2>
          </div>
          <AdminTable<AdminWorkoutSession>
            columns={recentWorkoutColumns}
            data={recentWorkouts}
            loading={loading}
            emptyMessage="Sin entrenamientos recientes"
            keyExtractor={(s) => s.id}
          />
        </div>
        <div className="bg-dark-900 border border-dark-800 rounded-xl">
          <div className="px-5 py-4 border-b border-dark-800">
            <h2 className="text-sm font-bold text-dark-100">Ãšltimos registros nutricionales</h2>
          </div>
          <AdminTable<AdminNutritionEntry>
            columns={recentNutritionColumns}
            data={recentNutrition}
            loading={loading}
            emptyMessage="Sin registros nutricionales"
            keyExtractor={(e) => e.id}
          />
        </div>
      </div>

    </AdminLayout>
  );
};

