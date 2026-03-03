import React from 'react';

const ANIM_STYLE = `
  @keyframes strokeGrow {
    from { stroke-dashoffset: var(--full-stroke); }
    to   { stroke-dashoffset: var(--target-offset); }
  }
`;

interface CircleGaugeProps {
  value: number;
  max: number;
  unit: string;
  label: string;
  color?: string;
  delta?: string;
}

function CircleGauge({ value, max, unit, label, color = '#0ea5e9', delta }: CircleGaugeProps) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(Math.max((value || 0) / max, 0), 1);
  const dash = pct * circumference;
  const gap  = circumference - dash;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="9" />
          {/* Fill */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-white leading-none">{value || '—'}</span>
          <span className="text-[10px] text-dark-400 font-semibold">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs font-semibold text-dark-300">{label}</span>
        {delta && (
          <p className="text-[10px] text-dark-500 mt-0.5">{delta}</p>
        )}
      </div>
    </div>
  );
}

interface BodyStatsCardProps {
  weight?: number | null;
  bodyFat?: number | null;
  loading?: boolean;
}

export const BodyStatsCard: React.FC<BodyStatsCardProps> = ({ weight, bodyFat, loading }) => {
  if (loading) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 h-full">
        <div className="h-5 w-28 bg-dark-800 rounded animate-pulse mb-6" />
        <div className="flex justify-around">
          <div className="w-28 h-28 rounded-full bg-dark-800 animate-pulse" />
          <div className="w-28 h-28 rounded-full bg-dark-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const weightVal = weight ? Math.round(weight * 10) / 10 : 0;
  const fatVal    = bodyFat ? Math.round(bodyFat * 10) / 10 : 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 h-full flex flex-col">
      <style>{ANIM_STYLE}</style>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-dark-50">Estado Actual</h2>
        <span className="text-[10px] text-dark-500 uppercase tracking-wider font-semibold">Hoy</span>
      </div>

      <div className="flex-1 flex flex-row justify-around items-center gap-2">
        <CircleGauge
          value={weightVal}
          max={150}
          unit="kg"
          label="Peso"
          color="#0ea5e9"
          delta={weight ? undefined : 'Sin registro'}
        />
        <CircleGauge
          value={fatVal}
          max={40}
          unit="%"
          label="Grasa Corporal"
          color="#f97316"
          delta={bodyFat ? undefined : 'Sin registro'}
        />
      </div>

      {!weight && !bodyFat && (
        <p className="text-[11px] text-dark-600 text-center mt-4">Registra tu progreso para ver los datos</p>
      )}
    </div>
  );
};
