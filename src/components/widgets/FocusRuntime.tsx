'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/datetime';
import { scheduleTimerAlarm } from '@/lib/chrome';
import { playChime } from '@/lib/sound';
import { useFocusDurations } from '@/hooks/useFocus';
import { useNow } from '@/hooks/useNow';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { MODE_LABEL, completePhase, remainingFor } from '@/store/slices/focus';

/**
 * Headless component: finishes phases when the timer hits zero, keeps the background
 * alarm (for notifications while no dashboard tab is open) in sync, and mirrors the
 * countdown into the tab title. Mount it once per page.
 */
export function FocusRuntime({ updateTitle = true }: { updateTitle?: boolean }) {
  const dispatch = useAppDispatch();
  const focus = useAppSelector((s) => s.focus);
  const prefs = useAppSelector((s) => s.settings.focus);
  const durations = useFocusDurations();
  const running = focus.status === 'running';
  const now = useNow(running ? 500 : null);
  const originalTitle = useRef<string | null>(null);

  // 1) Phase completion.
  useEffect(() => {
    if (!running || focus.endsAt === null || now < focus.endsAt) return;
    const overdue = now - focus.endsAt;
    const finished = focus.mode;
    dispatch(completePhase({ now, durations, autoStart: prefs.autoStart }));
    if (overdue < 15_000 && prefs.sound) playChime();
    toast.success(finished === 'focus' ? 'Focus session complete — time for a break.' : 'Break over — ready to focus?', {
      id: 'focus-complete',
      duration: 8000,
    });
  }, [now, running, focus.endsAt, focus.mode, durations, prefs.autoStart, prefs.sound, dispatch]);

  // 2) Background alarm so a notification fires even if this tab is gone.
  useEffect(() => {
    const label = prefs.notify ? focus.mode : '';
    void scheduleTimerAlarm(running && prefs.notify ? focus.endsAt : null, label);
  }, [running, focus.endsAt, focus.mode, prefs.notify]);

  // 3) Tab title countdown.
  useEffect(() => {
    if (!updateTitle) return;
    if (originalTitle.current === null) originalTitle.current = document.title;
    if (running) document.title = `${formatDuration(remainingFor(focus, now))} · ${MODE_LABEL[focus.mode]}`;
    else document.title = originalTitle.current;
  }, [running, focus, now, updateTitle]);

  useEffect(
    () => () => {
      if (originalTitle.current !== null) document.title = originalTitle.current;
    },
    [],
  );

  return null;
}
