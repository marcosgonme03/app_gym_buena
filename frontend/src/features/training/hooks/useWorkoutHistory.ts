// ============================================================================
// useWorkoutHistory — Historial paginado de sesiones
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { getWorkoutHistory } from '../services/trainingService';
import type { HistoryItem } from '../types';

const PAGE_SIZE = 12;

interface UseWorkoutHistoryResult {
  items:      HistoryItem[];
  loading:    boolean;
  hasMore:    boolean;
  total:      number;
  loadMore:   () => void;
  refresh:    () => Promise<void>;
}

export function useWorkoutHistory(): UseWorkoutHistoryResult {
  const [items,   setItems]   = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset,  setOffset]  = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const data = await getWorkoutHistory(PAGE_SIZE, currentOffset);
      setItems(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      if (!reset) setOffset(o => o + data.length);
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // React StrictMode cleanup — safe to ignore
      console.error('[useWorkoutHistory]', err);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) load(false);
  }, [loading, hasMore, load]);

  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await load(true);
  }, [load]);

  return { items, loading, hasMore, total: items.length, loadMore, refresh };
}
