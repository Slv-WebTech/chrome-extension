'use client';

import { motion } from 'framer-motion';
import { Command as CommandIcon, Moon, Pause, Settings, Sun, Timer } from 'lucide-react';
import { useState } from 'react';
import { useFocusDurations, useFocusView } from '@/hooks/useFocus';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { formatDuration } from '@/lib/datetime';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { MODE_LABEL, pauseTimer, startTimer } from '@/store/slices/focus';
import { toggleTheme } from '@/store/slices/settings';
import { currentTheme } from '@/lib/utils';
import { IconButton, Kbd } from '../ui/primitives';
import { SettingsDrawer } from '../settings/SettingsDrawer';
import { ClockGreeting } from '../widgets/ClockGreeting';
import { FocusCard } from '../widgets/FocusCard';
import { FocusRuntime } from '../widgets/FocusRuntime';
import { NOTES_INPUT_ID, NotesCard } from '../widgets/NotesCard';
import { QuickLinks } from '../widgets/QuickLinks';
import { QuoteCard } from '../widgets/QuoteCard';
import { SEARCH_INPUT_ID, SearchBar } from '../widgets/SearchBar';
import { TASK_INPUT_ID, TasksCard } from '../widgets/TasksCard';
import { WeatherCard } from '../widgets/WeatherCard';
import { Background } from './Background';
import { CommandPalette } from './CommandPalette';
import { ShortcutsDialog } from './ShortcutsDialog';

function FocusChip() {
  const { focus, remaining } = useFocusView();
  if (focus.status === 'idle') return null;
  const running = focus.status === 'running';
  return (
    <a
      href="#focus"
      className="glass flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-fg tabular"
      aria-label={`${MODE_LABEL[focus.mode]} timer ${running ? 'running' : 'paused'}, ${formatDuration(remaining)} left`}
    >
      {running ? <Timer className="size-4 text-accent-text" aria-hidden /> : <Pause className="size-4 text-fg-muted" aria-hidden />}
      {formatDuration(remaining)}
      <span className="hidden text-fg-muted sm:inline">{MODE_LABEL[focus.mode]}</span>
    </a>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { widgets, singleKeyShortcuts, theme } = useAppSelector((s) => s.settings);
  const focus = useAppSelector((s) => s.focus);
  const durations = useFocusDurations();
  const [palette, setPalette] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);

  useGlobalShortcuts(
    {
      palette: () => setPalette((open) => !open),
      search: () => document.getElementById(SEARCH_INPUT_ID)?.focus(),
      newTask: () => {
        const el = document.getElementById(TASK_INPUT_ID) ?? document.getElementById(NOTES_INPUT_ID);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus({ preventScroll: true });
      },
      toggleTimer: () =>
        dispatch(focus.status === 'running' ? pauseTimer({ now: Date.now() }) : startTimer({ now: Date.now(), durations })),
      toggleTheme: () => dispatch(toggleTheme(currentTheme())),
      settings: () => setSettingsOpen(true),
      help: () => setShortcuts(true),
    },
    singleKeyShortcuts,
  );

  const cards = [
    widgets.tasks && <TasksCard key="tasks" />,
    widgets.focus && <FocusCard key="focus" />,
    widgets.weather && <WeatherCard key="weather" />,
    widgets.notes && <NotesCard key="notes" />,
  ].filter(Boolean);

  const isDark = theme === 'dark' || (theme === 'system' && typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark');

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-xl bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <Background />
      <FocusRuntime />

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-end gap-2 p-3 sm:p-4">
        <FocusChip />
        <button
          type="button"
          onClick={() => setPalette(true)}
          className="glass hidden h-10 cursor-pointer items-center gap-2 rounded-full pr-2 pl-3.5 text-sm text-fg-muted hover:text-fg sm:flex"
          aria-label="Open command palette (Ctrl+K)"
        >
          <CommandIcon className="size-4" aria-hidden />
          Commands
          <Kbd>Ctrl K</Kbd>
        </button>
        <IconButton label="Open command palette" onClick={() => setPalette(true)} className="glass sm:hidden">
          <CommandIcon className="size-4" aria-hidden />
        </IconButton>
        <IconButton label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => dispatch(toggleTheme(currentTheme()))} className="glass">
          {isDark ? <Sun className="size-[1.1rem]" aria-hidden /> : <Moon className="size-[1.1rem]" aria-hidden />}
        </IconButton>
        <IconButton label="Open settings" onClick={() => setSettingsOpen(true)} className="glass">
          <Settings className="size-[1.1rem]" aria-hidden />
        </IconButton>
      </header>

      <main id="main" className="relative mx-auto flex min-h-screen w-full max-w-[88rem] flex-col px-4 pt-[clamp(4.5rem,13vh,9rem)] pb-16 sm:px-6">
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-1 flex-col gap-8">
          <motion.div variants={item}>
            <ClockGreeting />
          </motion.div>
          {widgets.search && (
            <motion.div variants={item}>
              <SearchBar />
            </motion.div>
          )}
          {widgets.links && (
            <motion.div variants={item}>
              <QuickLinks />
            </motion.div>
          )}
          {cards.length > 0 && (
            <motion.div variants={item} className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]">
              {cards}
            </motion.div>
          )}
          {widgets.quote && (
            <motion.div variants={item}>
              <QuoteCard />
            </motion.div>
          )}
          {cards.length === 0 && !widgets.search && !widgets.links && !widgets.quote && (
            <motion.p variants={item} className="text-center text-sm text-fg-muted">
              All widgets are hidden. Open settings (<Kbd>,</Kbd>) to turn some back on.
            </motion.p>
          )}
        </motion.div>
      </main>

      <CommandPalette open={palette} onOpenChange={setPalette} onOpenSettings={() => setSettingsOpen(true)} onOpenShortcuts={() => setShortcuts(true)} />
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} onOpenShortcuts={() => setShortcuts(true)} />
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </>
  );
}
