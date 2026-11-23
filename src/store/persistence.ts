import { onStorageChanged, storageGet, storageSet } from '@/lib/storage';
import { debounce } from '@/lib/utils';
import { type AppStore, hydrate, markHydrated } from './index';
import { sanitizeFocus, sanitizeLinks, sanitizeNotes, sanitizeSecrets, sanitizeSettings, sanitizeTasks } from './sanitize';

export const STATE_KEY = 'momentum.state.v1';
export const SECRETS_KEY = 'momentum.secrets.v1';
export const BOOT_KEY = 'momentum.boot';
export const UPLOAD_KEY = 'momentum.bg.upload.v1';
export const SCHEMA_VERSION = 1;

/** Slices that make up the main persisted document (secrets live under their own key). */
const MAIN_SLICES = ['settings', 'tasks', 'links', 'notes', 'focus'] as const;

function pickMain(state: ReturnType<AppStore['getState']>) {
  return {
    version: SCHEMA_VERSION,
    settings: state.settings,
    tasks: state.tasks,
    links: state.links,
    notes: state.notes,
    focus: state.focus,
  };
}

export function parseStoredState(raw: unknown) {
  const doc = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    settings: sanitizeSettings(doc.settings),
    tasks: sanitizeTasks(doc.tasks),
    links: sanitizeLinks(doc.links),
    notes: sanitizeNotes(doc.notes),
    focus: sanitizeFocus(doc.focus),
  };
}

/** Mirror the theme into localStorage so `boot.js` can theme the page before first paint. */
function writeBootMirror(state: ReturnType<AppStore['getState']>) {
  try {
    const { theme, accent } = state.settings;
    window.localStorage.setItem(BOOT_KEY, JSON.stringify({ theme, accent }));
  } catch {
    /* ignore */
  }
}

/**
 * Load persisted state, wire up write-behind persistence and cross-context sync
 * (popup <-> new tab <-> other windows). Returns a disposer.
 */
export async function startPersistence(store: AppStore): Promise<() => void> {
  const [mainRaw, secretsRaw] = await Promise.all([
    storageGet<unknown>(STATE_KEY, null),
    storageGet<unknown>(SECRETS_KEY, null),
  ]);

  store.dispatch(hydrate({ ...(mainRaw ? parseStoredState(mainRaw) : {}), secrets: sanitizeSecrets(secretsRaw) }));
  store.dispatch(markHydrated());
  writeBootMirror(store.getState());

  // Baseline = what we just loaded, so merely opening/closing a page never rewrites (and so never clobbers) storage.
  let lastMain = JSON.stringify(pickMain(store.getState()));
  let lastSecrets = JSON.stringify(store.getState().secrets);
  let prev = store.getState();

  const flush = () => {
    const state = store.getState();
    const main = JSON.stringify(pickMain(state));
    if (main !== lastMain) {
      lastMain = main;
      void storageSet(STATE_KEY, pickMain(state)).catch((error: unknown) => console.error('Persist failed', error));
    }
    const secrets = JSON.stringify(state.secrets);
    if (secrets !== lastSecrets) {
      lastSecrets = secrets;
      void storageSet(SECRETS_KEY, state.secrets).catch((error: unknown) => console.error('Persist failed', error));
    }
  };
  const scheduleFlush = debounce(flush, 200);

  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    const changed = MAIN_SLICES.some((slice) => state[slice] !== prev[slice]) || state.secrets !== prev.secrets;
    if (state.settings !== prev.settings) writeBootMirror(state);
    prev = state;
    if (changed) scheduleFlush();
  });

  const stopSync = onStorageChanged((key, value) => {
    if (key === STATE_KEY && value && JSON.stringify(value) !== lastMain) {
      const parsed = parseStoredState(value);
      lastMain = JSON.stringify({ version: SCHEMA_VERSION, ...parsed });
      store.dispatch(hydrate(parsed));
    } else if (key === SECRETS_KEY && value && JSON.stringify(value) !== lastSecrets) {
      const secrets = sanitizeSecrets(value);
      lastSecrets = JSON.stringify(secrets);
      store.dispatch(hydrate({ secrets }));
    }
  });

  const onHide = () => scheduleFlush.flush();
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') onHide();
  };
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    unsubscribe();
    stopSync();
    scheduleFlush.cancel();
    window.removeEventListener('pagehide', onHide);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
