/**
 * Defensive normalisation for anything that comes from storage or an imported file.
 * Unknown fields are dropped, wrong types fall back to defaults, numbers are clamped.
 */
import { BACKGROUND_PRESETS } from '@/lib/backgrounds';
import { CUSTOM_ENGINE_ID, SEARCH_ENGINES, isValidCustomTemplate } from '@/lib/search';
import { clamp, normalizeHttpUrl } from '@/lib/utils';
import { type FocusState, initialFocusState } from './slices/focus';
import { type LinksState, MAX_LINKS, initialLinksState } from './slices/links';
import { MAX_NOTE_LENGTH, type NotesState, initialNotesState } from './slices/notes';
import { type SecretsState, initialSecretsState } from './slices/secrets';
import {
  ACCENTS,
  type SavedLocation,
  type SettingsState,
  defaultSettings,
} from './slices/settings';
import {
  MAX_TASKS,
  MAX_TASK_LENGTH,
  type Priority,
  type Task,
  type TaskFilter,
  type TaskSort,
  type TasksState,
  initialTasksState,
} from './slices/tasks';

type Rec = Record<string, unknown>;

const isRec = (value: unknown): value is Rec => typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown, fallback: string, max = 200): string => (typeof value === 'string' ? value.slice(0, max) : fallback);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
const num = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback;

function sanitizeLocation(value: unknown): SavedLocation | null {
  if (!isRec(value)) return null;
  const lat = num(value.lat, NaN, -90, 90);
  const lon = num(value.lon, NaN, -180, 180);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return {
    name: str(value.name, 'Saved location', 80),
    region: typeof value.region === 'string' ? value.region.slice(0, 80) : undefined,
    country: typeof value.country === 'string' ? value.country.slice(0, 80) : undefined,
    lat,
    lon,
    source: value.source === 'geo' ? 'geo' : 'manual',
  };
}

export function sanitizeSettings(raw: unknown): SettingsState {
  const d = defaultSettings;
  if (!isRec(raw)) return d;
  const bg = isRec(raw.background) ? raw.background : {};
  const w = isRec(raw.weather) ? raw.weather : {};
  const s = isRec(raw.search) ? raw.search : {};
  const wd = isRec(raw.widgets) ? raw.widgets : {};
  const f = isRec(raw.focus) ? raw.focus : {};
  const q = isRec(raw.quote) ? raw.quote : {};

  const customTemplate = str(s.customUrl, '', 300);
  const engineIds = [...SEARCH_ENGINES.map((e) => e.id), CUSTOM_ENGINE_ID] as const;
  let engine = oneOf(s.engine, engineIds, d.search.engine);
  if (engine === CUSTOM_ENGINE_ID && !isValidCustomTemplate(customTemplate)) engine = d.search.engine;

  const customUrl = typeof bg.customUrl === 'string' ? (normalizeHttpUrl(bg.customUrl) ?? '') : '';

  return {
    name: str(raw.name, d.name, 40),
    theme: oneOf(raw.theme, ['system', 'light', 'dark'] as const, d.theme),
    accent: oneOf(raw.accent, ACCENTS, d.accent),
    hour12: bool(raw.hour12, d.hour12),
    showSeconds: bool(raw.showSeconds, d.showSeconds),
    showGreeting: bool(raw.showGreeting, d.showGreeting),
    reduceMotion: oneOf(raw.reduceMotion, ['system', 'on', 'off'] as const, d.reduceMotion),
    singleKeyShortcuts: bool(raw.singleKeyShortcuts, d.singleKeyShortcuts),
    background: {
      kind: oneOf(bg.kind, ['preset', 'unsplash', 'pexels', 'custom', 'upload'] as const, d.background.kind),
      preset: oneOf(bg.preset, BACKGROUND_PRESETS.map((p) => p.id), d.background.preset),
      customUrl,
      query: str(bg.query, d.background.query, 60),
      dim: num(bg.dim, d.background.dim, 0, 80),
      blur: num(bg.blur, d.background.blur, 0, 16),
    },
    weather: {
      provider: oneOf(w.provider, ['open-meteo', 'openweather'] as const, d.weather.provider),
      unit: oneOf(w.unit, ['c', 'f'] as const, d.weather.unit),
      windUnit: oneOf(w.windUnit, ['kmh', 'mph', 'ms'] as const, d.weather.windUnit),
      location: sanitizeLocation(w.location),
    },
    search: {
      engine,
      customUrl: customTemplate,
      rememberRecent: bool(s.rememberRecent, d.search.rememberRecent),
      recent: Array.isArray(s.recent) ? s.recent.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200)).slice(0, 8) : [],
    },
    widgets: {
      search: bool(wd.search, d.widgets.search),
      links: bool(wd.links, d.widgets.links),
      weather: bool(wd.weather, d.widgets.weather),
      tasks: bool(wd.tasks, d.widgets.tasks),
      focus: bool(wd.focus, d.widgets.focus),
      notes: bool(wd.notes, d.widgets.notes),
      quote: bool(wd.quote, d.widgets.quote),
    },
    focus: {
      focusMin: num(f.focusMin, d.focus.focusMin, 1, 180),
      shortMin: num(f.shortMin, d.focus.shortMin, 1, 60),
      longMin: num(f.longMin, d.focus.longMin, 1, 120),
      longEvery: Math.round(num(f.longEvery, d.focus.longEvery, 2, 12)),
      autoStart: bool(f.autoStart, d.focus.autoStart),
      sound: bool(f.sound, d.focus.sound),
      notify: bool(f.notify, d.focus.notify),
    },
    quote: { source: oneOf(q.source, ['bundled', 'online'] as const, d.quote.source) },
  };
}

function sanitizeTask(value: unknown): Task | null {
  if (!isRec(value)) return null;
  const text = str(value.text, '', MAX_TASK_LENGTH).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const done = bool(value.done, false);
  const createdAt = num(value.createdAt, Date.now(), 0, Number.MAX_SAFE_INTEGER);
  return {
    id: str(value.id, '', 80) || `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    priority: oneOf<Priority>(value.priority, ['high', 'medium', 'low'], 'medium'),
    done,
    createdAt,
    completedAt: done ? num(value.completedAt, createdAt, 0, Number.MAX_SAFE_INTEGER) : null,
  };
}

export function sanitizeTasks(raw: unknown): TasksState {
  if (!isRec(raw)) return initialTasksState;
  const seen = new Set<string>();
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(sanitizeTask)
    .filter((task): task is Task => {
      if (!task || seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    })
    .slice(0, MAX_TASKS);
  return {
    items,
    filter: oneOf<TaskFilter>(raw.filter, ['all', 'active', 'done'], 'all'),
    sort: oneOf<TaskSort>(raw.sort, ['priority', 'newest', 'oldest'], 'priority'),
  };
}

export function sanitizeLinks(raw: unknown): LinksState {
  if (!isRec(raw) || !Array.isArray(raw.items)) return initialLinksState;
  const seen = new Set<string>();
  const items = raw.items
    .map((value, index) => {
      if (!isRec(value)) return null;
      const url = typeof value.url === 'string' ? normalizeHttpUrl(value.url) : null;
      if (!url) return null;
      const id = str(value.id, '', 60) || `link-${index}`;
      if (seen.has(id)) return null;
      seen.add(id);
      return { id, url, title: str(value.title, '', 40).trim() || new URL(url).hostname.replace(/^www\./, '') };
    })
    .filter((link): link is NonNullable<typeof link> => link !== null)
    .slice(0, MAX_LINKS);
  return { items };
}

export function sanitizeNotes(raw: unknown): NotesState {
  if (!isRec(raw)) return initialNotesState;
  return {
    text: str(raw.text, '', MAX_NOTE_LENGTH),
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : null,
  };
}

/** Timer runtime is intentionally *not* trusted from files; only stats and round survive. */
export function sanitizeFocus(raw: unknown, keepRuntime = true): FocusState {
  const base = initialFocusState;
  if (!isRec(raw)) return base;
  const stats = isRec(raw.stats) ? raw.stats : {};
  const state: FocusState = {
    ...base,
    round: Math.round(num(raw.round, 0, 0, 12)),
    stats: {
      day: str(stats.day, '', 10),
      sessions: Math.round(num(stats.sessions, 0, 0, 10_000)),
      minutes: Math.round(num(stats.minutes, 0, 0, 1_000_000)),
    },
  };
  if (keepRuntime) {
    state.mode = oneOf(raw.mode, ['focus', 'short', 'long'] as const, 'focus');
    state.status = oneOf(raw.status, ['idle', 'running', 'paused'] as const, 'idle');
    state.remainingMs = num(raw.remainingMs, base.remainingMs, 1000, 4 * 60 * 60_000);
    state.endsAt = state.status === 'running' && typeof raw.endsAt === 'number' ? raw.endsAt : null;
    if (state.status === 'running' && state.endsAt === null) state.status = 'idle';
  }
  return state;
}

export function sanitizeSecrets(raw: unknown): SecretsState {
  if (!isRec(raw)) return initialSecretsState;
  return {
    openWeatherKey: str(raw.openWeatherKey, '', 200).trim(),
    unsplashKey: str(raw.unsplashKey, '', 200).trim(),
    pexelsKey: str(raw.pexelsKey, '', 200).trim(),
  };
}
