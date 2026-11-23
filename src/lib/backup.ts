import type { AppState } from '@/store';
import { sanitizeFocus, sanitizeLinks, sanitizeNotes, sanitizeSecrets, sanitizeSettings, sanitizeTasks } from '@/store/sanitize';

export const BACKUP_APP = 'momentum-dashboard';
export const BACKUP_SCHEMA = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  schema: number;
  exportedAt: string;
  data: {
    settings: AppState['settings'];
    tasks: AppState['tasks'];
    links: AppState['links'];
    notes: AppState['notes'];
    focus: AppState['focus'];
    secrets?: AppState['secrets'];
  };
}

export function buildBackup(state: AppState, options: { includeSecrets?: boolean; now?: Date } = {}): BackupFile {
  const { includeSecrets = false, now = new Date() } = options;
  return {
    app: BACKUP_APP,
    schema: BACKUP_SCHEMA,
    exportedAt: now.toISOString(),
    data: {
      settings: state.settings,
      tasks: state.tasks,
      links: state.links,
      notes: state.notes,
      // Only long-term stats are exported; a running timer is not portable.
      focus: sanitizeFocus(state.focus, false),
      ...(includeSecrets ? { secrets: state.secrets } : {}),
    },
  };
}

export type ParsedBackup =
  | { ok: true; data: Pick<AppState, 'settings' | 'tasks' | 'links' | 'notes' | 'focus'> & { secrets?: AppState['secrets'] }; exportedAt: string; counts: { tasks: number; links: number } }
  | { ok: false; error: string };

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

/** Validate and normalise an imported backup. Never throws. */
export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'This file is too large to be a Momentum backup.' };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (typeof json !== 'object' || json === null) return { ok: false, error: 'Unrecognised backup format.' };
  const file = json as Record<string, unknown>;
  if (file.app !== BACKUP_APP) return { ok: false, error: 'This is not a Momentum Dashboard backup.' };
  if (typeof file.schema !== 'number' || file.schema > BACKUP_SCHEMA) {
    return { ok: false, error: 'This backup was created by a newer version of Momentum.' };
  }
  const data = file.data;
  if (typeof data !== 'object' || data === null) return { ok: false, error: 'The backup contains no data.' };
  const d = data as Record<string, unknown>;

  const tasks = sanitizeTasks(d.tasks);
  const links = sanitizeLinks(d.links);
  return {
    ok: true,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
    counts: { tasks: tasks.items.length, links: links.items.length },
    data: {
      settings: sanitizeSettings(d.settings),
      tasks,
      links,
      notes: sanitizeNotes(d.notes),
      focus: sanitizeFocus(d.focus, false),
      ...(d.secrets ? { secrets: sanitizeSecrets(d.secrets) } : {}),
    },
  };
}

export function backupFilename(date: Date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `momentum-backup-${stamp}.json`;
}

/** Trigger a client-side download (no `downloads` permission needed). */
export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
