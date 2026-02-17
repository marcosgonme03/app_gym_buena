import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { GymClass } from '@/features/classes/types';
import { fetchClassDemandSignals } from '@/features/classes/services/classesService';

interface TrainerExtended {
  specialty: string | null;
  rating: number | null;
  classesCount: number;
}

interface ClassDetailExtended {
  trainer: TrainerExtended;
  demandLabel: string | null;
  demandCount: number;
  cancellationPolicy: string;
  classPlan: {
    warmupMin: number;
    mainMin: number;
    finisher: string;
    stretchesMin: number;
  };
}

const DEFAULT_POLICY = 'Cancela con al menos 2 horas de antelación para liberar plaza.';

function parseNumericRating(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(5, value));
  return null;
}

export function useClassDetailExtended(item: GymClass | null) {
  const [data, setData] = useState<ClassDetailExtended>({
    trainer: { specialty: null, rating: null, classesCount: 0 },
    demandLabel: null,
    demandCount: 0,
    cancellationPolicy: DEFAULT_POLICY,
    classPlan: {
      warmupMin: 10,
      mainMin: 30,
      finisher: 'Bloque final de intensidad progresiva.',
      stretchesMin: 10,
    },
  });
  const [loading, setLoading] = useState(true);

  const classPlan = useMemo(() => {
    const duration = item?.duration_min || 50;
    const warmupMin = Math.max(8, Math.round(duration * 0.2));
    const stretchesMin = Math.max(8, Math.round(duration * 0.15));
    const mainMin = Math.max(15, duration - warmupMin - stretchesMin);

    const text = `${item?.title || ''} ${item?.description || ''}`.toLowerCase();
    const finisher = /(hiit|cardio|spinning|cycle|zumba)/.test(text)
      ? 'Intervalos finales para elevar capacidad cardiovascular.'
      : /(movilidad|yoga|pilates|stretch)/.test(text)
      ? 'Secuencia de control postural y respiración guiada.'
      : 'Finisher técnico para consolidar fuerza y control.';

    return {
      warmupMin,
      mainMin,
      finisher,
      stretchesMin,
    };
  }, [item?.description, item?.duration_min, item?.title]);

  const refresh = useCallback(async () => {
    if (!item) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const trainerId = item.trainer_user_id;

      const loadTrainer = async () => {
        if (!trainerId) return { specialty: null, rating: null };

        const tryExtended = await supabase
          .from('users')
          .select('specialty,rating')
          .eq('user_id', trainerId)
          .maybeSingle();

        if (!tryExtended.error) {
          return {
            specialty: (tryExtended.data as any)?.specialty || null,
            rating: parseNumericRating((tryExtended.data as any)?.rating),
          };
        }

        return { specialty: null, rating: null };
      };

      const [trainerInfo, classCountResponse, demand] = await Promise.all([
        loadTrainer(),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('trainer_user_id', trainerId),
        fetchClassDemandSignals([item.id]),
      ]);

      const signal = demand[item.id];
      const threshold = 8;
      const demandLabel = signal?.recentBookings >= threshold ? 'Muy demandada esta semana' : signal?.label === '↑ Popular esta semana' ? signal.label : null;

      const policyFromStorage = typeof window !== 'undefined'
        ? window.localStorage.getItem('classes:cancellation-policy')
        : null;

      setData({
        trainer: {
          specialty: trainerInfo.specialty,
          rating: trainerInfo.rating,
          classesCount: classCountResponse.count || 0,
        },
        demandLabel,
        demandCount: signal?.recentBookings || 0,
        cancellationPolicy: policyFromStorage || DEFAULT_POLICY,
        classPlan,
      });
    } catch {
      setData((prev) => ({
        ...prev,
        classPlan,
      }));
    } finally {
      setLoading(false);
    }
  }, [classPlan, item]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
