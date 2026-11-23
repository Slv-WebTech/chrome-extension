'use client';

import { Command } from 'cmdk';
import {
  Cloud,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Keyboard,
  ListPlus,
  Moon,
  Palette,
  Pause,
  Play,
  Search as SearchIcon,
  Settings,
  SquareCheck,
  Sun,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { backupFilename, buildBackup, downloadJson } from '@/lib/backup';
import { SEARCH_ENGINES, pushRecentSearch, resolveSearch } from '@/lib/search';
import { currentTheme, hostnameOf } from '@/lib/utils';
import { useFocusDurations } from '@/hooks/useFocus';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { pauseTimer, startTimer } from '@/store/slices/focus';
import {
  ACCENTS,
  setRecentSearches,
  toggleTheme,
  updateSearchSettings,
  updateSettings,
  updateWeatherSettings,
} from '@/store/slices/settings';
import { addTask, selectVisibleTasks, toggleTask } from '@/store/slices/tasks';
import { REFRESH_BACKGROUND_EVENT } from './Background';
import { SEARCH_INPUT_ID } from '../widgets/SearchBar';
import { TASK_INPUT_ID } from '../widgets/TasksCard';

interface Cmd {
  id: string;
  group: string;
  label: ReactNode;
  /** Text matched against the query (label + keywords). */
  text: string;
  icon: ReactNode;
  run: () => void;
}

/** Every whitespace-separated query token must appear somewhere in the command text. */
function matches(query: string, text: string): boolean {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenSettings,
  onOpenShortcuts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}) {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s);
  const durations = useFocusDurations();
  const [query, setQuery] = useState('');
  const { settings, links, tasks, focus } = state;

  const close = () => {
    onOpenChange(false);
    setQuery('');
  };
  /** Close first, then act (so focus moves are not stolen back by the dialog). */
  const run = (fn: () => void) => {
    close();
    setTimeout(fn, 60);
  };

  const q = query.trim();
  const running = focus.status === 'running';
  const dark = currentTheme() === 'dark';

  const commands = useMemo<Cmd[]>(() => {
    const list: Cmd[] = [
      { id: 'search', group: 'Actions', text: 'focus search bar find google /', label: 'Focus search bar', icon: <SearchIcon className="size-4" />, run: () => document.getElementById(SEARCH_INPUT_ID)?.focus() },
      { id: 'task', group: 'Actions', text: 'new task add todo n', label: 'New task', icon: <ListPlus className="size-4" />, run: () => document.getElementById(TASK_INPUT_ID)?.focus() },
      {
        id: 'timer',
        group: 'Actions',
        text: 'toggle focus timer pomodoro start pause resume f',
        label: running ? 'Pause focus timer' : focus.status === 'paused' ? 'Resume focus timer' : 'Start focus timer',
        icon: running ? <Pause className="size-4" /> : <Play className="size-4" />,
        run: () => dispatch(running ? pauseTimer({ now: Date.now() }) : startTimer({ now: Date.now(), durations })),
      },
      {
        id: 'theme',
        group: 'Actions',
        text: 'toggle theme dark light mode d',
        label: `Switch to ${dark ? 'light' : 'dark'} theme`,
        icon: dark ? <Sun className="size-4" /> : <Moon className="size-4" />,
        run: () => dispatch(toggleTheme(currentTheme())),
      },
      { id: 'settings', group: 'Actions', text: 'open settings preferences options ,', label: 'Open settings', icon: <Settings className="size-4" />, run: onOpenSettings },
      { id: 'shortcuts', group: 'Actions', text: 'keyboard shortcuts help ?', label: 'Keyboard shortcuts', icon: <Keyboard className="size-4" />, run: onOpenShortcuts },
      { id: 'bg', group: 'Actions', text: 'new background photo refresh wallpaper image', label: 'New background photo', icon: <ImageIcon className="size-4" />, run: () => window.dispatchEvent(new Event(REFRESH_BACKGROUND_EVENT)) },
      {
        id: 'unit',
        group: 'Actions',
        text: 'temperature units fahrenheit celsius weather',
        label: `Show temperatures in °${settings.weather.unit === 'c' ? 'F' : 'C'}`,
        icon: <Cloud className="size-4" />,
        run: () => dispatch(updateWeatherSettings({ unit: settings.weather.unit === 'c' ? 'f' : 'c' })),
      },
      {
        id: 'export',
        group: 'Actions',
        text: 'export backup download data json',
        label: 'Export backup (JSON)',
        icon: <Download className="size-4" />,
        run: () => {
          downloadJson(backupFilename(), buildBackup(state));
          toast.success('Backup downloaded.');
        },
      },
      ...links.items.map<Cmd>((link) => ({
        id: `link-${link.id}`,
        group: 'Quick links',
        text: `open ${link.title} ${link.url}`,
        label: (
          <>
            {link.title} <span className="ml-1 text-xs text-fg-muted">{hostnameOf(link.url)}</span>
          </>
        ),
        icon: <ExternalLink className="size-4" />,
        run: () => window.location.assign(link.url),
      })),
      ...selectVisibleTasks({ ...tasks, filter: 'active' })
        .slice(0, 8)
        .map<Cmd>((task) => ({
          id: `task-${task.id}`,
          group: 'Complete a task',
          text: `complete task done ${task.text}`,
          label: task.text,
          icon: <SquareCheck className="size-4" />,
          run: () => dispatch(toggleTask({ id: task.id })),
        })),
      ...SEARCH_ENGINES.map<Cmd>((engine) => ({
        id: `engine-${engine.id}`,
        group: 'Search engine',
        text: `use ${engine.name} default search engine`,
        label: (
          <>
            Use {engine.name} {settings.search.engine === engine.id && <span className="text-xs text-fg-muted">(current)</span>}
          </>
        ),
        icon: <SearchIcon className="size-4" />,
        run: () => dispatch(updateSearchSettings({ engine: engine.id })),
      })),
      ...ACCENTS.map<Cmd>((accent) => ({
        id: `accent-${accent}`,
        group: 'Accent colour',
        text: `accent colour color ${accent}`,
        label: <span className="capitalize">{accent}</span>,
        icon: <Palette className="size-4" />,
        run: () => dispatch(updateSettings({ accent })),
      })),
    ];
    return list;
    // `state` is only read lazily inside the export handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, durations, focus.status, running, dark, links.items, tasks, settings.weather.unit, settings.search.engine, onOpenSettings, onOpenShortcuts]);

  const visible = q ? commands.filter((cmd) => matches(q, cmd.text)) : commands;
  const resolved = q ? resolveSearch(q, settings.search.engine, settings.search.customUrl) : null;

  const webCommands: Cmd[] = resolved
    ? [
        {
          id: 'web',
          group: 'Web',
          text: q,
          label: resolved.kind === 'url' ? `Open ${resolved.url}` : `Search ${resolved.engine.name} for “${resolved.query}”`,
          icon: resolved.kind === 'url' ? <ExternalLink className="size-4" /> : <SearchIcon className="size-4" />,
          run: () => {
            if (settings.search.rememberRecent && resolved.kind === 'search') {
              dispatch(setRecentSearches(pushRecentSearch(settings.search.recent, resolved.query)));
            }
            window.location.assign(resolved.url);
          },
        },
        {
          id: 'add-task',
          group: 'Web',
          text: q,
          label: `Add task “${q}”`,
          icon: <ListPlus className="size-4" />,
          run: () => {
            dispatch(addTask({ text: q }));
            toast.success('Task added.');
          },
        },
      ]
    : [];

  // Commands first, unless the input is an address or nothing else matches.
  const webFirst = resolved?.kind === 'url' || visible.length === 0;
  const ordered = webFirst ? [...webCommands, ...visible] : [...visible, ...webCommands];
  const groups = ordered.reduce<Array<{ name: string; items: Cmd[] }>>((acc, cmd) => {
    const existing = acc.find((g) => g.name === cmd.group);
    if (existing) existing.items.push(cmd);
    else acc.push({ name: cmd.group, items: [cmd] });
    return acc;
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setQuery('');
      }}
      label="Command palette"
      overlayClassName="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm"
      contentClassName="glass animate-pop fixed top-[14vh] left-1/2 z-[70] w-[min(94vw,40rem)] -translate-x-1/2 overflow-hidden rounded-card"
      shouldFilter={false}
      loop
    >
      <div className="flex items-center gap-3 border-b border-line px-4" style={{ background: 'var(--surface-solid)' }}>
        <SearchIcon className="size-4 text-fg-muted" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command, search the web, or add a task…"
          className="h-14 w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-muted"
        />
      </div>
      <Command.List className="scroll-thin max-h-[min(55vh,26rem)] overflow-y-auto p-2" style={{ background: 'var(--surface-solid)' }}>
        <Command.Empty className="px-3 py-8 text-center text-sm text-fg-muted">No matching commands.</Command.Empty>
        {groups.map((group) => (
          <Command.Group key={group.name} heading={group.name}>
            {group.items.map((cmd) => (
              <Command.Item key={cmd.id} value={`${cmd.id} ${cmd.text}`} onSelect={() => run(cmd.run)}>
                <span className="text-accent-text" aria-hidden>
                  {cmd.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[0.7rem] text-fg-muted" style={{ background: 'var(--surface-solid)' }}>
        <span>↑↓ navigate · Enter select · Esc close</span>
        <span>Momentum</span>
      </div>
    </Command.Dialog>
  );
}
