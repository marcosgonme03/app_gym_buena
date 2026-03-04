// ============================================================================
// NutritionEvolutionChart — AreaChart de calorías 30 días
// ============================================================================

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { NutritionEvolutionPoint } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(d, 10)}/${parseInt(m, 10)}`;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const kcal = payload.find((p: any) => p.dataKey === 'total_calories');
  const prot = payload.find((p: any) => p.dataKey === 'total_protein_g');
  const carb = payload.find((p: any) => p.dataKey === 'total_carbs_g');
  const fat  = payload.find((p: any) => p.dataKey === 'total_fat_g');

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 shadow-2xl text-xs min-w-[140px]">
      <p className="text-dark-400 mb-2 font-semibold">{label}</p>
      {kcal && <p className="text-orange-400 font-bold mb-1">{Math.round(kcal.value)} kcal</p>}
      <div className="space-y-0.5 text-dark-400">
        {prot && <p className="text-blue-400">{Math.round(prot.value)}g Proteínas</p>}
        {carb && <p className="text-emerald-400">{Math.round(carb.value)}g Carbohidratos</p>}
        {fat  && <p className="text-yellow-400">{Math.round(fat.value)}g Grasas</p>}
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const NutritionEvolutionChartSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3 py-4">
    <div className="flex items-end gap-1.5 h-44">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-dark-800 rounded-t"
          style={{ height: `${15 + Math.random() * 70}%` }}
        />
      ))}
    </div>
    <div className="flex gap-4 justify-center">
      <div className="h-3 w-20 bg-dark-800 rounded" />
      <div className="h-3 w-20 bg-dark-800 rounded" />
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

interface NutritionEvolutionChartProps {
  data: NutritionEvolutionPoint[];
}

export const NutritionEvolutionChart: React.FC<NutritionEvolutionChartProps> = ({ data }) => {
  const hasData = data.some(p => p.total_calories > 0);

  const chartData = data.map(p => ({
    ...p,
    date_label: fmtDate(p.entry_date),
  }));

  // Show only every 5th label on x-axis to avoid crowding
  const tickFormatter = (val: string, index: number) => (index % 5 === 0 ? val : '');

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-widest">Evolución 30 días</h2>
        <p className="text-xs text-dark-600 mt-0.5">Calorías y macros diarias</p>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 text-dark-700 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-dark-500 text-sm">Empieza a registrar para ver tu evolución</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCalories" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradProtein" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="date_label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={tickFormatter}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />

            <Tooltip content={<ChartTooltip />} />

            <Area
              type="monotone"
              dataKey="total_calories"
              name="Calorías"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#gradCalories)"
              dot={false}
              activeDot={{ r: 4, fill: '#f97316' }}
            />
            <Area
              type="monotone"
              dataKey="total_protein_g"
              name="Proteínas"
              stroke="#60a5fa"
              strokeWidth={1.5}
              fill="url(#gradProtein)"
              dot={false}
              activeDot={{ r: 3, fill: '#60a5fa' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      {hasData && (
        <div className="flex items-center justify-center gap-5 text-xs text-dark-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-orange-400 inline-block" />Calorías</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-blue-400 inline-block" />Proteínas</span>
        </div>
      )}
    </div>
  );
};
