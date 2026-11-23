'use client';

import { Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react';
import { formatDuration } from '@/lib/datetime';
import { useFocusView } from '@/hooks/useFocus';
import { useAppDispatch } from '@/store/hooks';
import {
  type FocusMode,
  MODE_LABEL,
  pauseTimer,
  resetTimer,
  setMode,
  skipPhase,
  startTimer,
  todayStats,
} from '@/store/slices/focus';
import { cn } from '@/lib/utils';
import { Button, Card, IconButton, Segmented } from '../ui/primitives';

const RADIUS = 64;
const CIRC = 2 * Math.PI * RADIUS;

export function FocusCard({ compact = false }: { compact?: boolean }) {
  const dispatch = useAppDispatch();
  const { focus, durations, now, remaining, progress } = useFocusView();
  const running = focus.status === 'running';
  const today = todayStats(focus, now);
  const label = formatDuration(remaining);

  const toggle = () => {
    if (running) dispatch(pauseTimer({ now: Date.now() }));
    else dispatch(startTimer({ now: Date.now(), durations }));
  };

  return (
    <Card id="focus" title="Focus timer" icon={<Timer className="size-4" aria-hidden />} className={cn(!compact && 'min-h-[16rem]')}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Segmented<FocusMode>
          label="Timer mode"
          value={focus.mode}
          onChange={(mode) => dispatch(setMode({ mode, durations }))}
          options={[
            { value: 'focus', label: 'Focus' },
            { value: 'short', label: 'Short' },
            { value: 'long', label: 'Long' },
          ]}
        />

        <div className="relative grid place-items-center">
          <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90" aria-hidden>
            <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="8" />
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - Math.min(1, Math.max(0, progress)))}
              style={{ transition: running ? 'stroke-dashoffset 0.3s linear' : 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="tabular text-4xl font-semibold tracking-tight text-fg" role="timer" aria-label={`${label} remaining, ${MODE_LABEL[focus.mode]}`}>
              {label}
            </p>
            <p className="text-xs font-medium text-fg-muted">{MODE_LABEL[focus.mode]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton label="Reset timer" variant="subtle" onClick={() => dispatch(resetTimer({ durations }))}>
            <RotateCcw className="size-4" aria-hidden />
          </IconButton>
          <Button variant="primary" size="lg" onClick={toggle} className="min-w-32" aria-pressed={running}>
            {running ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
            {running ? 'Pause' : focus.status === 'paused' ? 'Resume' : 'Start'}
          </Button>
          <IconButton label="Skip to next phase" variant="subtle" onClick={() => dispatch(skipPhase({ now: Date.now(), durations }))}>
            <SkipForward className="size-4" aria-hidden />
          </IconButton>
        </div>

        <p className="text-xs text-fg-muted tabular" aria-live="polite">
          Today: <span className="font-semibold text-fg">{today.sessions}</span> session{today.sessions === 1 ? '' : 's'} ·{' '}
          <span className="font-semibold text-fg">{today.minutes}</span> min focused
        </p>
      </div>
    </Card>
  );
}
