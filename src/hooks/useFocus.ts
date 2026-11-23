'use client';

import { useMemo } from 'react';
import { type FocusDurations, durationMs, remainingFor } from '@/store/slices/focus';
import { useAppSelector } from '@/store/hooks';
import { useNow } from './useNow';

/** Memoised durations derived from settings. */
export function useFocusDurations(): FocusDurations {
  const { focusMin, shortMin, longMin, longEvery } = useAppSelector((s) => s.settings.focus);
  return useMemo(() => ({ focusMin, shortMin, longMin, longEvery }), [focusMin, shortMin, longMin, longEvery]);
}

/** Live view of the timer: remaining time and progress (0..1). */
export function useFocusView() {
  const focus = useAppSelector((s) => s.focus);
  const durations = useFocusDurations();
  const now = useNow(focus.status === 'running' ? 250 : null);
  const remaining = remainingFor(focus, now);
  const total = durationMs(focus.mode, durations);
  return { focus, durations, now, remaining, progress: total > 0 ? 1 - remaining / total : 0, total };
}
