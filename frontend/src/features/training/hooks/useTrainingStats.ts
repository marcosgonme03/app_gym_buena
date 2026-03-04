// ============================================================================
// useTrainingStats — Stats del módulo de entrenamientos
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { getWorkoutStats } from '../services/trainingService';
import type { WorkoutStats } from '../types';

interface UseTrainingStatsResult {
  stats: WorkoutStats;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_STATS: WorkoutStats = {
  total_sessions:      0,
  total_weight_kg:     0,
  this_month_sessions: 0,
  this_week_sessions:  0,
  avg_duration_min:    null,
};

export function useTrainingStats(): UseTrainingStatsResult {
  const [stats,   setStats]   = useState<WorkoutStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWorkoutStats();
      setStats(data);
    } catch (err) {
      console.error('[useTrainingStats]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}
