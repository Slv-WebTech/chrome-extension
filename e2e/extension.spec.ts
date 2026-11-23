import AxeBuilder from '@axe-core/playwright';
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, mockNetwork, open, openDash, test } from './fixtures';

test.describe('Momentum Dashboard extension', () => {
  test('registers the service worker and declares minimal permissions', async ({ context, extensionId }) => {
    expect(extensionId).toMatch(/^[a-p]{32}$/);
    const [worker] = context.serviceWorkers();
    const manifest = await worker!.evaluate(() => chrome.runtime.getManifest());
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(['storage', 'alarms']);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.optional_permissions).toEqual(['notifications']);
  });

  test('new tab: renders the dashboard with no CSP or runtime errors', async ({ context, extensionId, errors }) => {
    await mockNetwork(context);
    const page = await context.newPage();
    await openDash(page, extensionId);
    await expect(page.getByRole('timer', { name: /Current time/ })).toBeVisible();
    await expect(page.getByRole('search', { name: 'Web search' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Focus timer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scratchpad' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Quick links' }).getByRole('link', { name: 'GitHub' })).toBeVisible();
    await page.screenshot({ path: 'test-results/newtab-dark.png' });
    expect(errors.filter((e) => !/favicon|ERR_FAILED|net::/.test(e)), errors.join('\n')).toEqual([]);
  });

  test('tasks: add with priority tag, complete, filter, persist across reload', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await openDash(page, extensionId);
    const input = page.locator('#task-input');
    await input.fill('Ship the Chrome extension !high');
    await input.press('Enter');
    await input.fill('Write the README');
    await input.press('Enter');
    const list = page.getByRole('list', { name: 'Task list' });
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await expect(list.getByRole('listitem').first()).toContainText('Ship the Chrome extension');
    await expect(page.getByLabel('Priority High. Click to change')).toBeVisible();

    await list.getByRole('checkbox', { name: /Write the README/ }).click();
    await expect(page.getByText('1/2 done')).toBeVisible();
    await page.getByRole('radio', { name: 'Done' }).check({ force: true });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await page.getByRole('radio', { name: 'All' }).check({ force: true });

    await page.waitForTimeout(500); // debounce flush
    await page.reload();
    await expect(page.getByRole('list', { name: 'Task list' }).getByRole('listitem')).toHaveCount(2);
    await expect(page.getByText('1/2 done')).toBeVisible();
  });

  test('command palette (Ctrl+K), shortcuts, theme and settings drawer', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await openDash(page, extensionId);
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await expect(palette).toBeVisible();
    const before = await page.locator('html').getAttribute('data-theme');
    await page.keyboard.type('toggle theme');
    await page.keyboard.press('Enter');
    await expect(palette).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-theme', before === 'light' ? 'dark' : 'light');
    await page.screenshot({ path: 'test-results/newtab-toggled.png' });

    await page.locator('body').click({ position: { x: 5, y: 400 } });
    await page.keyboard.press('/');
    await expect(page.locator('#search-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 5, y: 400 } });
    await page.keyboard.press(',');
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await page.screenshot({ path: 'test-results/settings-drawer.png' });
    await page.getByRole('radio', { name: 'dark' }).first().check({ force: true });
    await page.getByRole('radio', { name: 'Dark' }).check({ force: true });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
  });

  test('search: URL vs query resolution and engine bangs', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await context.route('https://duckduckgo.com/**', (route) => route.fulfill({ body: 'ddg', contentType: 'text/html' }));
    await context.route('https://example.com/**', (route) => route.fulfill({ body: 'example', contentType: 'text/html' }));
    await openDash(page, extensionId);
    await page.locator('#search-input').fill('!d hello world');
    await Promise.all([page.waitForURL(/duckduckgo\.com\/\?q=hello%20world/), page.locator('#search-input').press('Enter')]);
    await openDash(page, extensionId);
    await page.locator('#search-input').fill('example.com/path');
    await Promise.all([page.waitForURL('https://example.com/path'), page.locator('#search-input').press('Enter')]);
  });

  test('focus timer: start, countdown in title, pause, reset', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await openDash(page, extensionId);
    await expect(page.getByRole('timer', { name: /25:00 remaining/ })).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page).toHaveTitle(/24:\d\d · Focus/);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset timer' }).click();
    await expect(page.getByRole('timer', { name: /25:00 remaining/ })).toBeVisible();
  });

  test('focus timer: schedules and clears the background alarm when notifications are enabled', async ({ context, extensionId }) => {
    const [worker] = context.serviceWorkers();
    const page = await context.newPage();
    await open(page, extensionId, 'settings/index.html');
    // Seed settings the same way the app persists them (notify is normally enabled via the optional permission prompt).
    await page.evaluate(() => chrome.storage.local.set({ 'momentum.state.v1': { version: 1, settings: { focus: { notify: true } } } }));
    await openDash(page, extensionId);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect
      .poll(async () => (await worker!.evaluate(() => chrome.alarms.getAll())).map((a: { name: string }) => a.name))
      .toEqual(['momentum-timer:focus']);
    const [alarm] = await worker!.evaluate(() => chrome.alarms.getAll());
    expect(alarm!.scheduledTime).toBeGreaterThan(Date.now() + 24 * 60_000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect.poll(async () => (await worker!.evaluate(() => chrome.alarms.getAll())).length).toBe(0);
  });

  test('weather: city search, forecast, unit switch (network mocked)', async ({ context, extensionId }) => {
    await mockNetwork(context);
    const page = await context.newPage();
    await openDash(page, extensionId);
    await page.getByPlaceholder('Search for a city…').fill('Mumbai');
    await page.getByRole('button', { name: /Mumbai, Maharashtra, India/ }).click();
    await expect(page.getByText('27°', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Partly cloudy').first()).toBeVisible();
    await expect(page.getByText('5-day forecast')).toBeVisible();
    await page.getByRole('radio', { name: 'Fahrenheit' }).check({ force: true });
    await expect(page.getByText('81°').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/weather.png' });
  });

  test('weather: browser geolocation + reverse geocode (network mocked)', async ({ context, extensionId }) => {
    await mockNetwork(context);
    await context.grantPermissions(['geolocation']);
    const page = await context.newPage();
    await openDash(page, extensionId);
    // Permission already granted -> the weather card locates silently (no prompt is ever forced).
    await expect(page.getByText('New Delhi, Delhi, India')).toBeVisible();
  });

  test('popup renders quote, weather and tasks', async ({ context, extensionId, errors }) => {
    await mockNetwork(context);
    const page = await context.newPage();
    await page.setViewportSize({ width: 380, height: 600 });
    await open(page, extensionId, 'popup/index.html');
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('figure', { name: 'Quote' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather' })).toBeVisible();
    await page.screenshot({ path: 'test-results/popup.png' });
    expect(errors.filter((e) => !/favicon|net::/.test(e)), errors.join('\n')).toEqual([]);
  });

  test('settings page: export → reset → import round-trip, secrets excluded by default', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await open(page, extensionId, 'settings/index.html');
    await page.getByLabel('Your name').fill('Vivek');
    await page.getByLabel('OpenWeather API key', { exact: true }).fill('secret-test-key');
    await page.getByRole('button', { name: 'Save keys' }).click();

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
    const file = path.join(tmpdir(), `momentum-test-${Date.now()}.json`);
    await download.saveAs(file);
    const backup = JSON.parse(readFileSync(file, 'utf8')) as { app: string; data: { settings: { name: string }; secrets?: unknown } };
    expect(backup.app).toBe('momentum-dashboard');
    expect(backup.data.settings.name).toBe('Vivek');
    expect(backup.data.secrets).toBeUndefined();
    expect(readFileSync(file, 'utf8')).not.toContain('secret-test-key');

    await page.getByRole('button', { name: 'Reset everything' }).click();
    await page.getByRole('button', { name: 'Delete everything' }).click();
    await expect(page.getByLabel('Your name')).toHaveValue('');

    await page.locator('input[type=file][aria-label="Choose a backup file to import"]').setInputFiles(file);
    await page.getByRole('button', { name: 'Import and replace' }).click();
    await expect(page.getByLabel('Your name')).toHaveValue('Vivek');
    rmSync(file, { force: true });
  });

  test('invalid import is rejected', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await open(page, extensionId, 'settings/index.html');
    await page.locator('input[type=file][aria-label="Choose a backup file to import"]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await expect(page.getByText('This is not a Momentum Dashboard backup.')).toBeVisible();
  });

  for (const theme of ['dark', 'light'] as const) {
    test(`accessibility (axe, ${theme} theme): no serious or critical violations`, async ({ context, extensionId }) => {
      await mockNetwork(context);
      const page = await context.newPage();
      await openDash(page, extensionId);
      await page.getByPlaceholder('Search for a city…').fill('Mumbai');
      await page.getByRole('button', { name: /Mumbai/ }).click();
      await expect(page.getByText('5-day forecast')).toBeVisible();
      await page.locator('#task-input').fill('Check contrast');
      await page.locator('#task-input').press('Enter');
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await page.waitForTimeout(700);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }

  test('live network: Open-Meteo works from the extension without host permissions (skipped unless E2E_LIVE=1)', async ({ context, extensionId }) => {
    test.skip(process.env.E2E_LIVE !== '1', 'set E2E_LIVE=1 to hit the real APIs');
    const page = await context.newPage();
    await openDash(page, extensionId);
    await page.getByPlaceholder('Search for a city…').fill('London');
    await page.getByRole('button', { name: /London/ }).first().click();
    await expect(page.getByText('5-day forecast')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Updated (just now|\d+ min ago)/)).toBeVisible();
  });
});
