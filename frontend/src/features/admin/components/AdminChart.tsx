import React from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import type {
  ChartDataPoint, WeeklyActivityPoint, DailyActivityPoint,
  MacroDistribution, FunnelStep, HeatmapDay, RetentionStats, WeightProgressPoint,
} from '../types/adminTypes';

interface BaseProps {
  title: string;
  subtitle?: string;
  height?: number;
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#0f1117', border: '1px solid #1e2130', borderRadius: 8 },
  labelStyle: { color: '#94a3b8' },
};

// â”€â”€â”€ Chart card wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title, subtitle, children,
}) => (
  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
    <h3 className="text-sm font-semibold text-dark-200">{title}</h3>
    {subtitle && <p className="text-xs text-dark-500 mt-0.5 mb-4">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </div>
);

export const GrowthLineChart: React.FC<BaseProps & { data: ChartDataPoint[] }> = ({
  title, subtitle, data, height = 220,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.map(d => ({ name: d.label, Usuarios: d.value }))}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} itemStyle={{ color: '#818cf8' }} />
        <Area type="monotone" dataKey="Usuarios" stroke="#6366f1" strokeWidth={2}
          fill="url(#areaGrad)" dot={{ fill: '#6366f1', r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const WeeklyBarChart: React.FC<BaseProps & { data: ChartDataPoint[]; label?: string }> = ({
  title, subtitle, data, height = 220, label = 'Sesiones',
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.map(d => ({ name: d.label, [label]: d.value }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} itemStyle={{ color: '#22d3ee' }} />
        <Bar dataKey={label} fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const MultiLineChart: React.FC<BaseProps & { data: WeeklyActivityPoint[] }> = ({
  title, subtitle, data, height = 260,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
        <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        <Line type="monotone" dataKey="sessions" name="Sesiones" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} />
        <Line type="monotone" dataKey="users" name="Nuevos usuarios" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const DailyActivityChart: React.FC<BaseProps & { data: DailyActivityPoint[] }> = ({
  title, subtitle, data, height = 220,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        <Bar dataKey="sessions" name="Sesiones" fill="#22d3ee" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar dataKey="entries" name="NutriciÃ³n" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const MacroPieChart: React.FC<BaseProps & { data: MacroDistribution[] }> = ({
  title, subtitle, data, height = 220,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
          dataKey="value" nameKey="name" paddingAngle={3}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#0f1117', border: '1px solid #1e2130', borderRadius: 8 }}
          formatter={(value: number | undefined, name: string) => [`${(value ?? 0).toLocaleString('es-ES')}g`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
      </PieChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const HorizontalBarChart: React.FC<BaseProps & { data: ChartDataPoint[] }> = ({
  title, subtitle, data, height = 220,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.map(d => ({ name: d.label, Usos: d.value }))} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip {...tooltipStyle} itemStyle={{ color: '#a78bfa' }} />
        <Bar dataKey="Usos" fill="#a78bfa" radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);

// â”€â”€â”€ Funnel Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const FunnelChart: React.FC<BaseProps & { data: FunnelStep[] }> = ({
  title, subtitle, data,
}) => {
  const max = data[0]?.value || 1;
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="space-y-2.5 py-2">
        {data.map((step, i) => {
          const pct = Math.round((step.value / max) * 100);
          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-dark-300">{step.label}</span>
                <span className="text-xs font-bold" style={{ color: step.color }}>
                  {step.value.toLocaleString('es-ES')}
                  {i > 0 && max > 0 && (
                    <span className="text-dark-500 font-normal ml-1.5">({pct}%)</span>
                  )}
                </span>
              </div>
              <div className="h-7 bg-dark-800 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                  style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: step.color + '33', borderRight: `2px solid ${step.color}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
};

// â”€â”€â”€ Retention Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const RetentionChart: React.FC<BaseProps & { data: RetentionStats }> = ({
  title, subtitle, data,
}) => {
  const bars = [
    { label: '7 dÃ­as', value: data.day7, color: '#10b981' },
    { label: '14 dÃ­as', value: data.day14, color: '#6366f1' },
    { label: '30 dÃ­as', value: data.day30, color: '#f97316' },
  ];
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="space-y-4 py-2">
        {bars.map((b, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-dark-300">RetenciÃ³n a {b.label}</span>
              <span className="text-sm font-black" style={{ color: b.color }}>{b.value}%</span>
            </div>
            <div className="h-5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${b.value}%`, backgroundColor: b.color + '55', border: `1px solid ${b.color}` }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-dark-600 text-right">Base: {data.total.toLocaleString('es-ES')} usuarios con â‰¥1 sesiÃ³n</p>
      </div>
    </ChartCard>
  );
};

// â”€â”€â”€ Weight Progress Line Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const WeightProgressChart: React.FC<BaseProps & { data: WeightProgressPoint[] }> = ({
  title, subtitle, data, height = 220,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.map(d => ({ name: d.week, 'Peso kg': d.totalKg }))}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} itemStyle={{ color: '#fb923c' }}
          formatter={(v: number | undefined) => [`${(v ?? 0).toLocaleString('es-ES')} kg`, 'Peso total']} />
        <Area type="monotone" dataKey="Peso kg" stroke="#f97316" strokeWidth={2}
          fill="url(#weightGrad)" dot={{ fill: '#f97316', r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  </ChartCard>
);

// â”€â”€â”€ Activity Heatmap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HEATMAP_COLORS = ['#0f1117', '#14532d', '#15803d', '#16a34a', '#22c55e'];

function getHeatColor(count: number): string {
  if (count === 0) return HEATMAP_COLORS[0];
  if (count <= 2) return HEATMAP_COLORS[1];
  if (count <= 5) return HEATMAP_COLORS[2];
  if (count <= 9) return HEATMAP_COLORS[3];
  return HEATMAP_COLORS[4];
}

export const ActivityHeatmap: React.FC<BaseProps & { data: HeatmapDay[] }> = ({
  title, subtitle, data,
}) => {
  // Group by week columns (7 rows per column = 1 week)
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const m = new Date(week[0]?.date ?? '').getMonth();
    if (m !== lastMonth) { monthLabels.push({ label: months[m], col }); lastMonth = m; }
  });

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-dark-200">{title}</h3>
      {subtitle && <p className="text-xs text-dark-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      <div className="overflow-x-auto">
        <div style={{ position: 'relative' }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ gap: 3 }}>
            {weeks.map((_, col) => {
              const ml = monthLabels.find((m) => m.col === col);
              return (
                <div key={col} style={{ width: 11, flexShrink: 0 }}>
                  {ml && <span className="text-xxs text-dark-600 text-xs" style={{ fontSize: 9 }}>{ml.label}</span>}
                </div>
              );
            })}
          </div>
          {/* Grid */}
          <div className="flex" style={{ gap: 3 }}>
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col" style={{ gap: 3 }}>
                {week.map((day, row) => (
                  <div
                    key={row}
                    title={`${day.date}: ${day.count} sesiÃ³n${day.count !== 1 ? 'es' : ''}`}
                    style={{
                      width: 11, height: 11, borderRadius: 2,
                      backgroundColor: getHeatColor(day.count),
                      border: '1px solid #1e2130',
                      cursor: 'default',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs text-dark-500 mr-1">Menos</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: c, border: '1px solid #1e2130' }} />
        ))}
        <span className="text-xs text-dark-500 ml-1">MÃ¡s</span>
      </div>
    </div>
  );
};
