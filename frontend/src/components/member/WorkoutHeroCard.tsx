import React from 'react';
import type { TodayTrainingData, TrainingStatus } from './TodayTrainingCard';

interface WorkoutHeroCardProps {
  data: TodayTrainingData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

const WORKOUT_IMAGES: Record<string, string> = {
  default:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  fuerza:     'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80',
  cardio:     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  yoga:       'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80',
  hipertrofia:'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
};

function getImageForWorkout(type: string): string {
  const lower = (type ?? '').toLowerCase();
  if (lower.includes('fuerza') || lower.includes('pecho') || lower.includes('espalda') ||
      lower.includes('press') || lower.includes('brazos') || lower.includes('bícep') ||
      lower.includes('bicep') || lower.includes('tricep') || lower.includes('hombro') ||
      lower.includes('pierna') || lower.includes('gemelo') || lower.includes('glut'))
    return WORKOUT_IMAGES.fuerza;
  if (lower.includes('hipert')) return WORKOUT_IMAGES.hipertrofia;
  if (lower.includes('cardio') || lower.includes('corr') || lower.includes('aerob'))
    return WORKOUT_IMAGES.cardio;
  if (lower.includes('yoga') || lower.includes('movil') || lower.includes('flex'))
    return WORKOUT_IMAGES.yoga;
  return WORKOUT_IMAGES.default;
}

const CTA_LABEL: Record<TrainingStatus, string> = {
  not_started: 'COMENZAR',
  in_progress: 'CONTINUAR',
  completed:   'VER RESUMEN',
};

const CTA_COLOR: Record<TrainingStatus, string> = {
  not_started: 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/30 hover:shadow-primary-500/50',
  in_progress: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30 hover:shadow-emerald-500/50',
  completed:   'bg-dark-700 hover:bg-dark-600 shadow-dark-900/50',
};

export const WorkoutHeroCard: React.FC<WorkoutHeroCardProps> = ({
  data,
  loading,
  error,
  onRetry,
  onPrimaryAction,
  onSecondaryAction,
}) => {
  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden h-[220px] animate-pulse">
        <div className="absolute right-0 top-0 w-[58%] h-full bg-dark-800" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/90 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-7">
          <div className="space-y-3">
            <div className="h-3 w-36 bg-dark-700 rounded" />
            <div className="h-7 w-52 bg-dark-700 rounded" />
            <div className="h-4 w-44 bg-dark-700 rounded" />
          </div>
          <div className="h-11 w-36 bg-dark-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-7 h-[220px] flex flex-col justify-between">
        <div>
          <h2 className="text-base font-bold text-dark-50 mb-2">Entrenamiento de Hoy</h2>
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm transition-colors w-fit">
          Reintentar
        </button>
      </div>
    );
  }

  // ── Empty / no workout state ─────────────────────────────────────────────────
  if (!data || !data.hasPlannedWorkout) {
    return (
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden h-[220px] group">
        <img
          src={WORKOUT_IMAGES.default}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-20 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/95 to-dark-900/60 pointer-events-none" />
        <div className="relative z-10 h-full flex flex-col justify-between p-7">
          <div>
            <p className="text-[11px] text-primary-400 uppercase tracking-widest font-bold mb-2">Entrenamiento de Hoy</p>
            <h3 className="text-xl font-black text-dark-50 leading-tight">Sin entreno asignado</h3>
            <p className="text-sm text-dark-500 mt-1">Crea tu propio entrenamiento para hoy</p>
          </div>
          <button
            onClick={onPrimaryAction}
            className="px-7 py-3 bg-primary-500 hover:bg-primary-400 text-white font-black text-sm rounded-xl uppercase tracking-widest transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 w-fit"
          >
            Añadir entrenamiento
          </button>
        </div>
      </div>
    );
  }

  // ── Main hero ────────────────────────────────────────────────────────────────
  const imgSrc = getImageForWorkout(data.type);
  const ctaBg  = CTA_COLOR[data.status];

  const [displayTitle, displaySub] = data.type.includes(' - ')
    ? data.type.split(' - ', 2)
    : [data.type, null];

  const exerciseSub = data.exercises.length > 0
    ? data.exercises.slice(0, 3).map(e => e.name).join(' · ') +
      (data.exercises.length > 3 ? ` +${data.exercises.length - 3}` : '')
    : null;

  const subtitle = displaySub || exerciseSub;

  return (
    <div className="relative bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden h-[220px] group">
      {/* Athlete image — right half */}
      <img
        src={imgSrc}
        alt="Entrenamiento"
        className="absolute right-0 top-0 h-full w-[58%] object-cover object-top opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
      />
      {/* Gradient left→right */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/92 to-dark-900/20 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-7">
        <div>
          <p className="text-[11px] text-primary-400 uppercase tracking-widest font-bold mb-2">
            Entrenamiento de Hoy
          </p>
          <h3 className="text-[1.4rem] font-black text-white leading-tight max-w-[58%]">
            {displayTitle}
          </h3>
          {subtitle && (
            <p className="text-sm text-dark-400 mt-1 max-w-[58%] leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onPrimaryAction}
            className={`px-8 py-3 ${ctaBg} text-white font-black text-sm rounded-xl uppercase tracking-widest transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
          >
            {CTA_LABEL[data.status]}
          </button>

          {data.estimatedDurationMin > 0 && data.status === 'not_started' && (
            <div className="flex items-center gap-1.5 text-dark-400 text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {data.estimatedDurationMin} min
            </div>
          )}

          {data.status === 'not_started' && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="text-xs text-dark-600 hover:text-dark-400 transition-colors font-medium"
            >
              Registrar manual
            </button>
          )}
        </div>
      </div>

      {/* Status badge top-right */}
      {data.status === 'in_progress' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          En curso
        </div>
      )}
      {data.status === 'completed' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-dark-800/90 border border-dark-700 text-dark-300 text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          ✓ Completado
        </div>
      )}
    </div>
  );
};

