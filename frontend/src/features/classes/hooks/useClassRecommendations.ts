import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ClassListItem } from '@/features/classes/hooks/useClasses';
import type { ClassDemandSignal } from '@/features/classes/services/classesService';
import { useMyBookings } from '@/features/classes/hooks/useMyBookings';
import { inferClassKind } from '@/features/classes/hooks/useClassesExtended';

interface RecommendationContext {
  preferredLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  preferredKind: 'strength' | 'cardio' | 'mobility' | null;
  targetGoal: string | null;
}

export function useClassRecommendations(classes: ClassListItem[], demandSignals: Record<string, ClassDemandSignal>) {
  const { data: myBookings } = useMyBookings();
  const [context, setContext] = useState<RecommendationContext>({
    preferredLevel: null,
    preferredKind: null,
    targetGoal: null,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const metadata = (data.user?.user_metadata || {}) as Record<string, unknown>;

        const goalRaw = typeof metadata.goal === 'string'
          ? metadata.goal
          : typeof metadata.objective === 'string'
          ? metadata.objective
          : null;

        const levelRaw = typeof metadata.level === 'string' ? metadata.level : null;
        const level = levelRaw === 'beginner' || levelRaw === 'intermediate' || levelRaw === 'advanced'
          ? levelRaw
          : null;

        if (!cancelled) {
          setContext((prev) => ({
            ...prev,
            preferredLevel: level,
            targetGoal: goalRaw,
          }));
        }
      } catch {
        if (!cancelled) {
          setContext((prev) => ({ ...prev }));
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const inferredContext = useMemo(() => {
    if (!myBookings.length) return context;

    const classById = new Map(classes.map((item) => [item.id, item]));
    const kindCounter = new Map<'strength' | 'cardio' | 'mobility', number>();
    const levelCounter = new Map<'beginner' | 'intermediate' | 'advanced', number>();

    for (const booking of myBookings) {
      const classId = booking.class_sessions?.classes?.id;
      if (!classId) continue;
      const cls = classById.get(classId);
      if (!cls) continue;

      const kind = inferClassKind(cls);
      kindCounter.set(kind, (kindCounter.get(kind) || 0) + 1);

      const level = cls.level;
      if (level === 'beginner' || level === 'intermediate' || level === 'advanced') {
        levelCounter.set(level, (levelCounter.get(level) || 0) + 1);
      }
    }

    const preferredKind = Array.from(kindCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const preferredLevel = context.preferredLevel || Array.from(levelCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      preferredLevel,
      preferredKind,
      targetGoal: context.targetGoal,
    };
  }, [classes, context, myBookings]);

  const recommendations = useMemo(() => {
    if (!classes.length) return [];

    const sorted = [...classes].sort((left, right) => {
      const leftSignal = demandSignals[left.id];
      const rightSignal = demandSignals[right.id];

      const leftKind = inferClassKind(left);
      const rightKind = inferClassKind(right);

      const leftScore =
        (left.hasMyBooking ? 6 : 0) +
        (inferredContext.preferredLevel && left.level === inferredContext.preferredLevel ? 4 : 0) +
        (inferredContext.preferredKind && leftKind === inferredContext.preferredKind ? 4 : 0) +
        (leftSignal?.recentBookings || 0) +
        (leftSignal?.trend === 'up' ? 2 : 0);

      const rightScore =
        (right.hasMyBooking ? 6 : 0) +
        (inferredContext.preferredLevel && right.level === inferredContext.preferredLevel ? 4 : 0) +
        (inferredContext.preferredKind && rightKind === inferredContext.preferredKind ? 4 : 0) +
        (rightSignal?.recentBookings || 0) +
        (rightSignal?.trend === 'up' ? 2 : 0);

      if (leftScore !== rightScore) return rightScore - leftScore;

      const leftDate = left.nextSessions[0] ? new Date(left.nextSessions[0].startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDate = right.nextSessions[0] ? new Date(right.nextSessions[0].startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    });

    return sorted.slice(0, 4);
  }, [classes, demandSignals, inferredContext]);

  const fallbackToPopular = !inferredContext.preferredKind && !inferredContext.preferredLevel && !inferredContext.targetGoal;

  return {
    recommendations,
    fallbackToPopular,
    context: inferredContext,
  };
}
