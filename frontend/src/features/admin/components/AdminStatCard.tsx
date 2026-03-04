import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}

const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   ring: 'ring-blue-500/20'   },
  green:  { bg: 'bg-green-500/10',  icon: 'text-green-400',  ring: 'ring-green-500/20'  },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', ring: 'ring-purple-500/20' },
  orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', ring: 'ring-orange-500/20' },
  red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    ring: 'ring-red-500/20'    },
  teal:   { bg: 'bg-teal-500/10',   icon: 'text-teal-400',   ring: 'ring-teal-500/20'   },
};

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title, value, subtitle, trend, icon, color,
}) => {
  const c = colorMap[color];
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-5 hover:border-dark-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ring-1 ${c.bg} ${c.ring}`}>
          <span className={`w-5 h-5 block ${c.icon}`}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-dark-50 tracking-tight">
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </p>
      <p className="text-sm text-dark-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-dark-600 mt-0.5">{subtitle}</p>}
      {trend && <p className="text-xs text-dark-500 mt-2">{trend.label}</p>}
    </div>
  );
};
