import { defineConfig } from '@playwright/test';

/**
 * End-to-end smoke tests load the *built* extension (./out) into Chromium via --load-extension.
 * Build first: `pnpm build`. Set CHROMIUM_PATH to reuse an already-installed Chromium build.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
});
