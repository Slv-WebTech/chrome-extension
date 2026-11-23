/**
 * Storage abstraction.
 *
 * Inside the extension everything lives in `chrome.storage.local`. In the web
 * demo / dev server / unit tests it transparently falls back to `localStorage`.
 * Nothing is ever sent to a server.
 */

export type StorageListener = (key: string, newValue: unknown) => void;

const hasWindow = typeof window !== 'undefined';

function chromeLocal(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === 'undefined') return null;
  return chrome.storage?.local ?? null;
}

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  const area = chromeLocal();
  if (area) {
    try {
      const items = await area.get(key);
      const value = items[key] as T | undefined;
      return value === undefined ? fallback : value;
    } catch (error) {
      console.error('storageGet failed', error);
      return fallback;
    }
  }
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function storageSet(key: string, value: unknown): Promise<void> {
  const area = chromeLocal();
  if (area) {
    try {
      await area.set({ [key]: value });
    } catch (error) {
      console.error('storageSet failed', error);
      throw error;
    }
    return;
  }
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('storageSet failed', error);
    throw error;
  }
}

export async function storageRemove(key: string): Promise<void> {
  const area = chromeLocal();
  if (area) {
    await area.remove(key);
    return;
  }
  if (hasWindow) window.localStorage.removeItem(key);
}

/** Subscribe to changes made by *other* contexts (popup, other tabs, import). */
export function onStorageChanged(listener: StorageListener): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    const handler = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      for (const [key, change] of Object.entries(changes)) listener(key, change.newValue);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
  if (!hasWindow) return () => undefined;
  const handler = (event: StorageEvent) => {
    if (!event.key) return;
    let value: unknown = null;
    try {
      value = event.newValue === null ? undefined : JSON.parse(event.newValue);
    } catch {
      value = undefined;
    }
    listener(event.key, value);
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
