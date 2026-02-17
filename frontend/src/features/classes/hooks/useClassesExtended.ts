import { useEffect, useMemo, useState } from 'react';
import type { ClassListItem } from '@/features/classes/hooks/useClasses';
import { fetchClassDemandSignals, type ClassDemandSignal } from '@/features/classes/services/classesService';

export type TimeBand = 'all' | 'morning' | 'afternoon' | 'evening';
export type DurationBand = 'all' | 'short' | 'medium' | 'long';
export type ClassKind = 'all' | 'strength' | 'cardio' | 'mobility';
export type SortMode = 'recommended' | 'popular' | 'closest' | 'least_occupied';

export interface AdvancedClassesFilters {
  timeBand: TimeBand;
  trainer: string;
  duration: DurationBand;
  classKind: ClassKind;
  sortBy: SortMode;
}

export interface CalendarClassItem {
  sessionId: string;
  classId: string;
  slug: string;
  title: string;
  trainerName: string;
  startsAt: string;
  totalSpots: number;
  remainingSpots: number;
  hasMyBooking: boolean;
}

const defaultDemandSignal: ClassDemandSignal = {
  classId: '',
  recentBookings: 0,
  previousBookings: 0,
  trend: 'steady',
  label: 'Estable',
};

export function inferClassKind(item: ClassListItem): Exclude<ClassKind, 'all'> {
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  if (/(movilidad|mobility|yoga|pilates|stretch|estira)/.test(text)) return 'mobility';
  if (/(cardio|hiit|spinning|cycle|running|zumba)/.test(text)) return 'cardio';
  return 'strength';
}

function matchesTimeBand(startsAt: string, timeBand: TimeBand) {
  if (timeBand === 'all') return true;
  const hour = new Date(startsAt).getHours();
  if (timeBand === 'morning') return hour >= 6 && hour < 12;
  if (timeBand === 'afternoon') return hour >= 12 && hour < 18;
  return hour >= 18 || hour < 6;
}

function matchesDuration(duration: number, durationBand: DurationBand) {
  if (durationBand === 'all') return true;
  if (durationBand === 'short') return duration < 40;
  if (durationBand === 'medium') return duration >= 40 && duration <= 60;
  return duration > 60;
}

function toSortScore(item: ClassListItem, signal: ClassDemandSignal, sortBy: SortMode) {
  const firstSession = item.nextSessions[0];
  const occupancy = firstSession?.occupancyRatio ?? 0;
  const startsAt = firstSession ? new Date(firstSession.startsAt).getTime() : Number.MAX_SAFE_INTEGER;

  switch (sortBy) {
    case 'popular':
      return signal.recentBookings * 10 + (signal.trend === 'up' ? 3 : 0);
    case 'closest':
      return -startsAt;
    case 'least_occupied':
      return -occupancy;
    case 'recommended':
    default:
      return (item.hasMyBooking ? 8 : 0) + signal.recentBookings + (signal.trend === 'up' ? 3 : 0) - occupancy * 2;
  }
}

export function useClassesExtended(classes: ClassListItem[], filters: AdvancedClassesFilters) {
  const [demandSignals, setDemandSignals] = useState<Record<string, ClassDemandSignal>>({});
  const [demandLoading, setDemandLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!classes.length) {
          setDemandSignals({});
          return;
        }

        setDemandLoading(true);
        const signals = await fetchClassDemandSignals(classes.map((item) => item.id));
        if (!cancelled) setDemandSignals(signals);
      } catch {
        if (!cancelled) setDemandSignals({});
      } finally {
        if (!cancelled) setDemandLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [classes]);

  const filteredAndSorted = useMemo(() => {
    const filtered = classes.filter((item) => {
      const firstSession = item.nextSessions[0];
      if (!firstSession) return false;

      if (filters.trainer !== 'all' && item.trainerName !== filters.trainer) return false;
      if (!matchesTimeBand(firstSession.startsAt, filters.timeBand)) return false;
      if (!matchesDuration(item.duration_min, filters.duration)) return false;
      if (filters.classKind !== 'all' && inferClassKind(item) !== filters.classKind) return false;

      return true;
    });

    return [...filtered].sort((left, right) => {
      const leftSignal = demandSignals[left.id] || { ...defaultDemandSignal, classId: left.id };
      const rightSignal = demandSignals[right.id] || { ...defaultDemandSignal, classId: right.id };

      const leftScore = toSortScore(left, leftSignal, filters.sortBy);
      const rightScore = toSortScore(right, rightSignal, filters.sortBy);

      if (leftScore !== rightScore) return rightScore - leftScore;
      return left.title.localeCompare(right.title, 'es');
    });
  }, [classes, demandSignals, filters]);

  const calendarItemsByDay = useMemo(() => {
    const buckets: Record<number, CalendarClassItem[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (const item of filteredAndSorted) {
      for (const session of item.nextSessions) {
        if (session.isCancelled) continue;
        const day = new Date(session.startsAt).getDay();

        buckets[day].push({
          sessionId: session.id,
          classId: item.id,
          slug: item.slug,
          title: item.title,
          trainerName: item.trainerName,
          startsAt: session.startsAt,
          totalSpots: session.totalSpots,
          remainingSpots: session.remainingSpots,
          hasMyBooking: session.hasMyBooking,
        });
      }
    }

    for (const day of Object.keys(buckets)) {
      buckets[Number(day)] = buckets[Number(day)].sort((a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
    }

    return buckets;
  }, [filteredAndSorted]);

  return {
    demandSignals,
    demandLoading,
    filteredAndSorted,
    calendarItemsByDay,
  };
}
