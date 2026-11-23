import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/store';
import { SECRETS_KEY, STATE_KEY, startPersistence } from '@/store/persistence';
import { setSecrets } from '@/store/slices/secrets';
import { updateSettings } from '@/store/slices/settings';
import { addTask } from '@/store/slices/tasks';

const tick = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

describe('persistence (localStorage fallback outside the extension)', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('hydrates defaults on a fresh profile and marks the store ready', async () => {
    const store = makeStore();
    expect(store.getState().meta.hydrated).toBe(false);
    const stop = await startPersistence(store);
    expect(store.getState().meta.hydrated).toBe(true);
    expect(store.getState().links.items.length).toBeGreaterThan(0);
    stop();
  });

  it('does not write anything just because a page was opened and closed', async () => {
    const store = makeStore();
    const stop = await startPersistence(store);
    window.dispatchEvent(new Event('pagehide'));
    await tick();
    expect(window.localStorage.getItem(STATE_KEY)).toBeNull();
    stop();
  });

  it('writes state (debounced) and restores it in a new store', async () => {
    const a = makeStore();
    const stopA = await startPersistence(a);
    a.dispatch(updateSettings({ name: 'Ada', theme: 'dark' }));
    a.dispatch(addTask({ text: 'Persist me' }));
    await tick();
    stopA();

    const stored = JSON.parse(window.localStorage.getItem(STATE_KEY) ?? 'null');
    expect(stored.settings.name).toBe('Ada');

    const b = makeStore();
    const stopB = await startPersistence(b);
    expect(b.getState().settings.name).toBe('Ada');
    expect(b.getState().tasks.items.map((t) => t.text)).toEqual(['Persist me']);
    stopB();
  });

  it('keeps API keys in their own storage key, separate from the main document', async () => {
    const store = makeStore();
    const stop = await startPersistence(store);
    store.dispatch(setSecrets({ unsplashKey: 'abc123' }));
    await tick();
    stop();
    expect(window.localStorage.getItem(STATE_KEY) ?? '').not.toContain('abc123');
    expect(JSON.parse(window.localStorage.getItem(SECRETS_KEY) ?? '{}').unsplashKey).toBe('abc123');
  });

  it('mirrors the theme for the pre-paint boot script', async () => {
    const store = makeStore();
    const stop = await startPersistence(store);
    store.dispatch(updateSettings({ theme: 'light', accent: 'rose' }));
    expect(JSON.parse(window.localStorage.getItem('momentum.boot') ?? '{}')).toEqual({ theme: 'light', accent: 'rose' });
    stop();
  });

  it('survives corrupted storage', async () => {
    window.localStorage.setItem(STATE_KEY, '{definitely not json');
    const store = makeStore();
    const stop = await startPersistence(store);
    expect(store.getState().meta.hydrated).toBe(true);
    expect(store.getState().tasks.items).toEqual([]);
    stop();
  });

  it('picks up changes written by another context (popup / other tab)', async () => {
    const store = makeStore();
    const stop = await startPersistence(store);
    const other = makeStore();
    other.dispatch(addTask({ text: 'From the popup' }));
    const doc = { version: 1, ...other.getState() };
    const value = JSON.stringify({ version: 1, settings: doc.settings, tasks: doc.tasks, links: doc.links, notes: doc.notes, focus: doc.focus });
    window.dispatchEvent(new StorageEvent('storage', { key: STATE_KEY, newValue: value }));
    expect(store.getState().tasks.items.map((t) => t.text)).toEqual(['From the popup']);
    stop();
  });
});
