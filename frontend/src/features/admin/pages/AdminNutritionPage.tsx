import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminTable } from '../components/AdminTable';
import type { AdminTableColumn } from '../components/AdminTable';
import { getAdminNutritionEntries, getAdminNutritionStats } from '../services/adminService';
import type { AdminNutritionEntry, AdminNutritionStats, MacroDistribution } from '../types/adminTypes';
import { MacroPieChart } from '../components/AdminChart';

const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  lunch:     'bg-orange-500/15 text-orange-400 border-orange-500/25',
  dinner:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  snack:     'bg-green-500/15 text-green-400 border-green-500/25',
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  dinner:    'Cena',
  snack:     'Merienda',
};

export const AdminNutritionPage: React.FC = () => {
  const [entries, setEntries] = useState<AdminNutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminNutritionStats | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getAdminNutritionEntries(80), getAdminNutritionStats()])
      .then(([e, s]) => { setEntries(e); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return !q
      || e.user_name?.toLowerCase().includes(q)
      || e.food_name?.toLowerCase().includes(q);
  });

  // Macro distribution data for MacroPieChart
  const macroData: MacroDistribution[] = stats ? [
    { name: 'Proteína',       value: Math.round(stats.totalProtein), color: '#3b82f6' },
    { name: 'Carbohidratos',  value: Math.round(stats.totalCarbs),   color: '#f97316' },
    { name: 'Grasas',         value: Math.round(stats.totalFat),     color: '#eab308' },
  ] : [];

  const columns: AdminTableColumn<AdminNutritionEntry>[] = [
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
      key: 'food_name',
      header: 'Alimento',
      render: (row) => <span className="text-dark-200">{row.food_name}</span>,
    },
    {
      key: 'meal_type',
      header: 'Comida',
      width: 'w-28',
      render: (row) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${MEAL_COLORS[row.meal_type] ?? 'bg-dark-700/50 text-dark-400 border-dark-700'}`}>
          {MEAL_LABELS[row.meal_type] ?? row.meal_type}
        </span>
      ),
    },
    {
      key: 'entry_date',
      header: 'Fecha',
      width: 'w-24',
      render: (row) => (
        <span className="text-dark-400 text-xs">{new Date(row.entry_date).toLocaleDateString('es-ES')}</span>
      ),
    },
    {
      key: 'calories',
      header: 'Kcal',
      width: 'w-20',
      render: (row) => <span className="text-orange-400 font-medium">{row.calories}</span>,
    },
    {
      key: 'protein_g',
      header: 'Prot.',
      width: 'w-20',
      render: (row) => <span className="text-blue-400">{row.protein_g}g</span>,
    },
    {
      key: 'carbs_g',
      header: 'Carbs.',
      width: 'w-20',
      render: (row) => <span className="text-yellow-400">{row.carbs_g}g</span>,
    },
    {
      key: 'fat_g',
      header: 'Grasas',
      width: 'w-20',
      render: (row) => <span className="text-dark-300">{row.fat_g}g</span>,
    },
  ];

  return (
    <AdminLayout title="Nutrición" subtitle="Registro de entradas nutricionales">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <AdminStatCard title="Total entradas" value={stats?.totalEntries ?? 0} color="orange" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        } />
        <AdminStatCard title="Media kcal/usuario" value={Math.round(stats?.avgCaloriesPerUser ?? 0)} color="red" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        } />
        <AdminStatCard title="Proteínas totales" value={`${Math.round(stats?.totalProtein ?? 0).toLocaleString('es-ES')}g`} color="blue" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        } />
        <AdminStatCard title="Carbohidratos totales" value={`${Math.round(stats?.totalCarbs ?? 0).toLocaleString('es-ES')}g`} color="teal" icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        } />
      </div>

      {/* Macro distribution chart */}
      {stats && macroData.length > 0 && (
        <div className="mb-5">
          <MacroPieChart
            title="Distribución de macros"
            subtitle="Gramos totales registrados — proteína, carbohidratos y grasas"
            data={macroData}
            height={260}
          />
        </div>
      )}

      {/* Search */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl mb-4 p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuario o alimento..."
          className="w-full bg-transparent text-dark-200 placeholder-dark-600 text-sm focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl">
        <AdminTable<AdminNutritionEntry>
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No se encontraron entradas"
          keyExtractor={(e) => e.id}
        />
      </div>
    </AdminLayout>
  );
};
