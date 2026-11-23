import path from 'node:path';
import { expect, mockNetwork, openDash, test, open } from './fixtures';

/**
 * Regenerates the README screenshots:  E2E_SCREENSHOTS=1 pnpm test:e2e e2e/screenshots.spec.ts
 * (network is mocked so the images are deterministic).
 */
test.skip(process.env.E2E_SCREENSHOTS !== '1', 'set E2E_SCREENSHOTS=1 to regenerate docs/screenshots');

const out = (name: string) => path.resolve(__dirname, '..', 'docs', 'screenshots', name);

test('capture README screenshots', async ({ context, extensionId }) => {
  await mockNetwork(context);
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1240 });
  await openDash(page, extensionId);
  await page.getByPlaceholder('Search for a city…').fill('Mumbai');
  await page.getByRole('button', { name: /Mumbai/ }).click();
  const task = page.locator('#task-input');
  for (const text of ['Ship Momentum v2 !high', 'Review pull requests', 'Plan the week !low']) {
    await task.fill(text);
    await task.press('Enter');
  }
  await page.getByRole('checkbox', { name: /Review pull requests/ }).click();
  await page.locator('#notes-input').fill('Ideas\n- Try the command palette (Ctrl+K)\n- Export a backup before travelling');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.locator('body').click({ position: { x: 5, y: 500 } });
  await page.locator('[data-sonner-toaster]').evaluate((el) => ((el as HTMLElement).style.display = 'none')); // hide transient toasts
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);

  for (const theme of ['dark', 'light'] as const) {
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
    }, theme);
    await page.waitForTimeout(700);
    await page.screenshot({ path: out(`newtab-${theme}.png`), fullPage: false });
  }

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('palette.png') });
  await page.keyboard.press('Escape');

  await page.locator('body').click({ position: { x: 5, y: 500 } });
  await page.keyboard.press(',');
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: out('settings.png') });
  await page.keyboard.press('Escape');

  const popup = await context.newPage();
  await popup.setViewportSize({ width: 380, height: 640 });
  await open(popup, extensionId, 'popup/index.html');
  await expect(popup.getByRole('heading', { name: 'Weather' })).toBeVisible();
  await popup.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await popup.waitForTimeout(800);
  await popup.screenshot({ path: out('popup.png') });
});
