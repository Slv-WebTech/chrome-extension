import { describe, expect, it } from 'vitest';
import { BACKUP_APP, buildBackup, parseBackup } from '@/lib/backup';
import { makeStore } from '@/store';
import { hydrate } from '@/store';
import { setSecrets } from '@/store/slices/secrets';
import { updateSettings } from '@/store/slices/settings';
import { addTask } from '@/store/slices/tasks';

function seededState() {
  const store = makeStore();
  store.dispatch(updateSettings({ name: 'Vivek', accent: 'emerald' }));
  store.dispatch(addTask({ text: 'Ship it !high' }, 5));
  store.dispatch(setSecrets({ openWeatherKey: 'super-secret' }));
  return store.getState();
}

describe('backup export/import', () => {
  it('excludes API keys unless explicitly requested', () => {
    const state = seededState();
    const plain = JSON.stringify(buildBackup(state));
    expect(plain).not.toContain('super-secret');
    expect(JSON.stringify(buildBackup(state, { includeSecrets: true }))).toContain('super-secret');
  });

  it('round-trips through JSON', () => {
    const state = seededState();
    const parsed = parseBackup(JSON.stringify(buildBackup(state)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.settings.name).toBe('Vivek');
    expect(parsed.data.settings.accent).toBe('emerald');
    expect(parsed.data.tasks.items).toHaveLength(1);
    expect(parsed.data.secrets).toBeUndefined();
    expect(parsed.counts.tasks).toBe(1);

    const store = makeStore();
    store.dispatch(hydrate(parsed.data));
    expect(store.getState().tasks.items[0]).toMatchObject({ text: 'Ship it', priority: 'high' });
  });

  it('does not export or import a running timer', () => {
    const state = seededState();
    const running = { ...state, focus: { ...state.focus, status: 'running' as const, endsAt: Date.now() + 1000 } };
    const parsed = parseBackup(JSON.stringify(buildBackup(running)));
    expect(parsed.ok && parsed.data.focus.status).toBe('idle');
  });

  it('rejects garbage safely', () => {
    expect(parseBackup('not json')).toMatchObject({ ok: false });
    expect(parseBackup('[]')).toMatchObject({ ok: false });
    expect(parseBackup(JSON.stringify({ app: 'something-else', schema: 1, data: {} }))).toMatchObject({ ok: false });
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP, schema: 999, data: {} }))).toMatchObject({ ok: false });
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP, schema: 1 }))).toMatchObject({ ok: false });
    expect(parseBackup('x'.repeat(6 * 1024 * 1024))).toMatchObject({ ok: false });
  });

  it('sanitises hostile or malformed content instead of trusting it', () => {
    const file = {
      app: BACKUP_APP,
      schema: 1,
      data: {
        settings: { theme: 'neon', accent: 'pink', name: 'n'.repeat(500), background: { customUrl: 'javascript:alert(1)', dim: 9999 }, search: { engine: 'custom', customUrl: 'http://bad/%s' } },
        tasks: { items: [{ text: '<img src=x onerror=alert(1)>', priority: 'urgent' }, { text: '' }, 42, null] },
        links: { items: [{ id: 'a', title: 'Evil', url: 'javascript:alert(1)' }, { id: 'b', title: 'Good', url: 'example.com' }] },
        notes: { text: 'hello' },
      },
    };
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { settings, tasks, links } = parsed.data;
    expect(settings.theme).toBe('system');
    expect(settings.accent).toBe('indigo');
    expect(settings.name).toHaveLength(40);
    expect(settings.background.customUrl).toBe('');
    expect(settings.background.dim).toBe(80);
    expect(settings.search.engine).toBe('google');
    expect(tasks.items).toHaveLength(1);
    expect(tasks.items[0]!.priority).toBe('medium');
    expect(links.items).toEqual([{ id: 'b', title: 'Good', url: 'https://example.com/' }]);
  });
});
