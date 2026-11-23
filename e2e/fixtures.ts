import { type BrowserContext, type Page, test as base, chromium, expect } from '@playwright/test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const extensionPath = path.resolve(__dirname, '..', 'out');

export const FORECAST = {
  utc_offset_seconds: 19800,
  current: { temperature_2m: 27.4, apparent_temperature: 29.1, relative_humidity_2m: 48, weather_code: 2, wind_speed_10m: 3.2, pressure_msl: 1008, cloud_cover: 40, is_day: 1 },
  hourly: {
    time: Array.from({ length: 48 }, (_, i) => Math.floor(Date.now() / 3_600_000) * 3600 + i * 3600),
    temperature_2m: Array.from({ length: 48 }, (_, i) => 24 + (i % 6)),
    weather_code: Array.from({ length: 48 }, () => 1),
    is_day: Array.from({ length: 48 }, () => 1),
  },
  daily: {
    time: Array.from({ length: 6 }, (_, i) => Math.floor(Date.now() / 86_400_000) * 86400 - 19800 + i * 86400),
    weather_code: [2, 3, 61, 0, 95, 71],
    temperature_2m_max: [30, 31, 28, 33, 29, 2],
    temperature_2m_min: [21, 22, 20, 24, 21, -3],
    precipitation_probability_max: [10, 20, 80, 0, 60, 30],
  },
};

export const test = base.extend<{ context: BrowserContext; extensionId: string; errors: string[] }>({
  context: async ({}, provide) => {
    if (!existsSync(path.join(extensionPath, 'manifest.json'))) throw new Error('Build the extension first: pnpm build');
    const userDataDir = mkdtempSync(path.join(tmpdir(), 'momentum-e2e-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      // CHROMIUM_PATH: reuse an installed Chromium; otherwise Playwright's 'chromium' channel (new headless, supports extensions).
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' as const }),
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
      geolocation: { latitude: 28.6139, longitude: 77.209 },
      locale: 'en-GB',
      viewport: { width: 1440, height: 900 },
    });
    await provide(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },
  extensionId: async ({ context }, provide) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    await provide(new URL(worker.url()).host);
  },
  errors: async ({ context }, provide) => {
    const errors: string[] = [];
    context.on('page', (page) => {
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
      });
    });
    await provide(errors);
  },
});

export async function mockNetwork(context: BrowserContext) {
  await context.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: FORECAST }));
  await context.route('https://api.bigdatacloud.net/**', (route) => route.fulfill({ json: { city: 'New Delhi', principalSubdivision: 'Delhi', countryName: 'India' } }));
  await context.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [{ name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.07, longitude: 72.87 }] } }),
  );
}

export const open = (page: Page, id: string, route = 'index.html') => page.goto(`chrome-extension://${id}/${route}`);

/** Opens the new tab and waits until the app has hydrated its persisted state. */
export async function openDash(page: Page, id: string) {
  await open(page, id);
  await expect(page.getByRole('timer', { name: /Current time/ })).toBeVisible();
}

export { expect };
