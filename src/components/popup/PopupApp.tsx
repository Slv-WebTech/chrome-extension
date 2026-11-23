'use client';

import { ExternalLink, Pause, Play, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useFocusView } from '@/hooks/useFocus';
import { useNow } from '@/hooks/useNow';
import { formatClock, formatLongDate, greetingFor, formatDuration } from '@/lib/datetime';
import { openDashboardTab, openSettingsPage } from '@/lib/chrome';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { MODE_LABEL, pauseTimer, startTimer } from '@/store/slices/focus';
import { Button, IconButton } from '../ui/primitives';
import { Background } from '../dashboard/Background';
import { FocusRuntime } from '../widgets/FocusRuntime';
import { QuoteCard } from '../widgets/QuoteCard';
import { TasksCard } from '../widgets/TasksCard';
import { WeatherCard } from '../widgets/WeatherCard';

/**
 * Toolbar popup: the compact "Daily Boost" view (quote + weather) from the original popup
 * extension, plus quick tasks and the focus timer.
 */
export function PopupApp() {
  const dispatch = useAppDispatch();
  const { hour12, name } = useAppSelector((s) => s.settings);
  const widgets = useAppSelector((s) => s.settings.widgets);
  const { focus, durations, remaining } = useFocusView();
  const now = new Date(useNow(10_000));
  const { time, period } = formatClock(now, { hour12, seconds: false });
  const running = focus.status === 'running';

  useEffect(() => {
    document.body.dataset.surface = 'popup';
    return () => {
      delete document.body.dataset.surface;
    };
  }, []);

  return (
    <>
      <Background />
      <FocusRuntime updateTitle={false} />
      <main className="space-y-3 p-3">
        <header className="flex items-center justify-between gap-2">
          <div className="text-on-bg min-w-0">
            <p className="tabular text-3xl leading-none font-semibold tracking-tight text-fg">
              {time}
              {period && <span className="ml-1 text-sm font-medium text-fg-muted">{period}</span>}
            </p>
            <p className="mt-1 truncate text-xs text-fg-muted">
              {greetingFor(now.getHours())}
              {name.trim() ? `, ${name.trim()}` : ''} · {formatLongDate(now)}
            </p>
          </div>
          <div className="flex gap-1">
            <IconButton label="Open dashboard in a new tab" onClick={openDashboardTab} className="glass">
              <ExternalLink className="size-4" aria-hidden />
            </IconButton>
            <IconButton label="Open settings" onClick={openSettingsPage} className="glass">
              <Settings className="size-4" aria-hidden />
            </IconButton>
          </div>
        </header>

        {widgets.focus && (
          <section aria-label="Focus timer" className="glass flex items-center justify-between gap-3 rounded-card px-4 py-3">
            <div>
              <p className="tabular text-2xl leading-none font-semibold text-fg" role="timer">
                {formatDuration(remaining)}
              </p>
              <p className="mt-1 text-xs text-fg-muted">{MODE_LABEL[focus.mode]}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              aria-pressed={running}
              onClick={() => dispatch(running ? pauseTimer({ now: Date.now() }) : startTimer({ now: Date.now(), durations }))}
            >
              {running ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {running ? 'Pause' : focus.status === 'paused' ? 'Resume' : 'Start focus'}
            </Button>
          </section>
        )}
        {widgets.quote && <QuoteCard compact />}
        {widgets.weather && <WeatherCard compact />}
        {widgets.tasks && <TasksCard compact maxVisible={5} />}
      </main>
    </>
  );
}
