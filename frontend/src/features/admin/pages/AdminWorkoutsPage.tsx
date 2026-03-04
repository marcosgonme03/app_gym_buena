import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminTable } from '../components/AdminTable';
import type { AdminTableColumn } from '../components/AdminTable';
import { getAdminWorkoutSessions, getWorkoutStats } from '../services/adminService';
import type { AdminWorkoutSession } from '../types/adminTypes';

type Filter = 'all' | 'completed';
type Category = 'all' | 'fuerza' | 'cardio' | 'full_body' | 'flexibilidad' | 'hiit';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all',          label: 'Todas las categorías' },
  { value: 'fuerza',       label: 'Fuerza' },
  { value: 'cardio',       label: 'Cardio' },
  { value: 'full_body',    label: 'Full Body' },
  { value: 'flexibilidad', label: 'Flexibilidad' },
  { value: 'hiit',         label: 'HIIT' },
];

const CAT_COLORS: Record<string, string> = {
  fuerza:      'bg-purple-500/15 text-purple-400 border-purple-500/25',
  cardio:      'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  full_body:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  flexibilidad:'bg-green-500/15 text-green-400 border-green-500/25',
  hiit:        'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400 border-green-500/25',
  in_progress: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  pending: 'bg-dark-700/50 text-dark-400 border-dark-700',
};

export const AdminWorkoutsPage: React.FC = () => {
  const [sessions, setSessions] = useState<AdminWorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, thisWeek: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState<Category>('all');

  useEffect(() => {
    Promise.all([getAdminWorkoutSessions(80), getWorkoutStats()])
      .then(([s, st]) => { setSessions(s); setStats(st); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter((s) => {
    const matchStatus = filter === 'all' || s.status === 'completed';
    const matchCategory = category === 'all' || s.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q
      || s.user_name?.toLowerCase().includes(q)
      || s.session_name?.toLowerCase().includes(q);
    return matchStatus && matchCategory && matchSearch;
  });

  const columns: AdminTableColumn<AdminWorkoutSession>[] = [
    {
      key: 'user_name',
      header: 'Usuario',
      render: (row) => (
        <div>
          <p className="text-dark-100 font-medium">{row.user_name}</p>
          <p className="text-xs text-dark-500">{row.user_email}</p>
        </div>
      ),
    },
    {
      key: 'session_name',
      header: 'Sesión',
      render: (row) => <span className="text-dark-200">{row.session_name || '—'}</span>,
    },
    {
      key: 'category',
      header: 'Categoría',
      width: 'w-32',
      render: (row) => row.category ? (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${CAT_COLORS[row.category] ?? 'bg-dark-700/50 text-dark-400 border-dark-700'}`}>
          {row.category}
        </span>
      ) : <span className="text-dark-600">—</span>,
    },
    {
      key: 'workout_date',
      header: 'Fecha',
      width: 'w-28',
      render: (row) => (
        <span className="text-dark-400 text-xs">
          {new Date(row.workout_date).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      key: 'actual_duration_min',
      header: 'Duración',
      width: 'w-24',
      render: (row) => (
        <span className="text-dark-300">
          {row.actual_duration_min ? `${row.actual_duration_min} min` : '—'}
        </span>
      ),
    },
    {
      key: 'total_weight_kg',
      header: 'Peso total',
      width: 'w-24',
      render: (row) => (
        <span className="text-dark-300">
          {row.total_weight_kg ? `${Number(row.total_weight_kg).toFixed(1)} kg` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: 'w-32',
      render: (row) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[row.status] ?? STATUS_COLORS['pending']}`}>
          {row.status === 'completed' ? 'Completada'
            : row.status === 'in_progress' ? 'En progreso' : row.status}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Entrenamientos" subtitle="Registro de sesiones de entrenamiento">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <AdminStatCard title="Total sesiones" value={stats.total} color="purple" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        } />
        <AdminStatCard title="Completadas" value={stats.completed}
          subtitle={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% del total`}
          color="green" icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
            </svg>
          } />
        <AdminStatCard title="Esta semana" value={stats.thisWeek} color="teal" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        } />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 bg-dark-900 border border-dark-800 rounded-xl p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario o sesión..."
            className="w-full bg-transparent text-dark-200 placeholder-dark-600 text-sm focus:outline-none"
          />
        </div>
        {/* Category dropdown */}
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="appearance-none bg-dark-900 border border-dark-800 rounded-xl px-4 py-2 pr-9 text-sm text-dark-200 focus:outline-none focus:border-primary-500/50 cursor-pointer h-full"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Status filter buttons */}
        <div className="flex gap-2">
          {(['all', 'completed'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
                  : 'bg-dark-900 border border-dark-800 text-dark-400 hover:text-dark-200'
              }`}
            >
              {f === 'all' ? 'Todas' : 'Completadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl">
        <AdminTable<AdminWorkoutSession>
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No se encontraron sesiones"
          keyExtractor={(s) => s.id}
        />
      </div>
    </AdminLayout>
  );
};
