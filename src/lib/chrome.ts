/**
 * Thin, defensive wrappers around chrome.* APIs. Every function is a safe no-op
 * outside of an extension (web demo, dev server, unit tests).
 */
import { isExtensionContext } from './utils';

export const TIMER_ALARM_PREFIX = 'momentum-timer:';

/** Schedule (or clear, when `endsAt` is null) the alarm that notifies when a focus phase ends. */
export async function scheduleTimerAlarm(endsAt: number | null, label: string): Promise<void> {
  if (!isExtensionContext() || !chrome.alarms) return;
  try {
    await clearAllTimerAlarms();
    if (endsAt !== null && endsAt > Date.now()) {
      // Chrome persists the alarm across service-worker restarts; the label travels in the name.
      await chrome.alarms.create(`${TIMER_ALARM_PREFIX}${encodeURIComponent(label)}`, { when: endsAt });
    }
  } catch (error) {
    console.error('Could not schedule alarm', error);
  }
}

export async function clearAllTimerAlarms(): Promise<void> {
  if (!isExtensionContext() || !chrome.alarms) return;
  const alarms = await chrome.alarms.getAll();
  await Promise.all(alarms.filter((a) => a.name.startsWith(TIMER_ALARM_PREFIX)).map((a) => chrome.alarms.clear(a.name)));
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!isExtensionContext() || !chrome.permissions) return false;
  try {
    return await chrome.permissions.contains({ permissions: ['notifications'] });
  } catch {
    return false;
  }
}

/** Must be called from a user gesture (e.g. a click). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isExtensionContext() || !chrome.permissions) return false;
  try {
    return await chrome.permissions.request({ permissions: ['notifications'] });
  } catch {
    return false;
  }
}

export async function removeNotificationPermission(): Promise<void> {
  if (!isExtensionContext() || !chrome.permissions) return;
  try {
    await chrome.permissions.remove({ permissions: ['notifications'] });
  } catch {
    /* ignore */
  }
}

/** Open the dashboard (new tab) from the toolbar popup. */
export function openDashboardTab(): void {
  if (isExtensionContext() && chrome.tabs) {
    void chrome.tabs.create({});
    window.close();
  } else {
    window.location.href = '/';
  }
}

export function openSettingsPage(): void {
  if (isExtensionContext() && chrome.runtime?.openOptionsPage) {
    void chrome.runtime.openOptionsPage();
    window.close();
  } else {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/settings/`;
  }
}
