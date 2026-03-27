const hasWindow = typeof window !== "undefined";

type StorageAreaName = "local" | "sync" | "session";

type ChromeStorageArea = {
    get: (keys: string | string[] | object | null, callback: (items: Record<string, unknown>) => void) => void;
    set: (items: Record<string, unknown>, callback?: () => void) => void;
    remove?: (keys: string | string[], callback?: () => void) => void;
};

function getChromeStorageArea(area: StorageAreaName): ChromeStorageArea | null {
    if (!hasWindow) return null;

    const chromeObj = (globalThis as any).chrome;
    const storage = chromeObj?.storage?.[area];

    if (!storage || typeof storage.get !== "function" || typeof storage.set !== "function") {
        return null;
    }

    return storage as ChromeStorageArea;
}

function getWebStorage(area: StorageAreaName): Storage | null {
    if (!hasWindow) return null;

    if (area === "session") return window.sessionStorage;
    return window.localStorage;
}

async function getValueFromArea<T>(area: StorageAreaName, key: string, fallback: T): Promise<T> {
    const chromeStorage = getChromeStorageArea(area);

    if (chromeStorage) {
        return new Promise<T>((resolve) => {
            chromeStorage.get(key, (items) => {
                const value = items?.[key] as T | undefined;
                resolve(value ?? fallback);
            });
        });
    }

    const webStorage = getWebStorage(area);
    if (!webStorage) return fallback;

    try {
        const raw = webStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

async function setValueToArea<T>(area: StorageAreaName, key: string, value: T): Promise<void> {
    const chromeStorage = getChromeStorageArea(area);

    if (chromeStorage) {
        return new Promise<void>((resolve) => {
            chromeStorage.set({ [key]: value }, () => resolve());
        });
    }

    const webStorage = getWebStorage(area);
    if (!webStorage) return;

    try {
        webStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage failures in non-extension contexts.
    }
}

async function removeValueFromArea(area: StorageAreaName, key: string): Promise<void> {
    const chromeStorage = getChromeStorageArea(area);

    if (chromeStorage?.remove) {
        return new Promise<void>((resolve) => {
            chromeStorage.remove?.(key, () => resolve());
        });
    }

    const webStorage = getWebStorage(area);
    if (!webStorage) return;

    try {
        webStorage.removeItem(key);
    } catch {
        // Ignore storage failures in non-extension contexts.
    }
}

async function removeValuesByPrefixFromArea(area: StorageAreaName, prefix: string): Promise<void> {
    const chromeStorage = getChromeStorageArea(area);

    if (chromeStorage) {
        await new Promise<void>((resolve) => {
            chromeStorage.get(null, (items) => {
                const keysToRemove = Object.keys(items || {}).filter((key) => key.startsWith(prefix));

                if (keysToRemove.length === 0 || !chromeStorage.remove) {
                    resolve();
                    return;
                }

                chromeStorage.remove(keysToRemove, () => resolve());
            });
        });
        return;
    }

    const webStorage = getWebStorage(area);
    if (!webStorage) return;

    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < webStorage.length; i += 1) {
            const key = webStorage.key(i);
            if (key && key.startsWith(prefix)) keysToRemove.push(key);
        }

        keysToRemove.forEach((key) => webStorage.removeItem(key));
    } catch {
        // Ignore storage failures in non-extension contexts.
    }
}

export async function getLocalValue<T>(key: string, fallback: T): Promise<T> {
    return getValueFromArea("local", key, fallback);
}

export async function setLocalValue<T>(key: string, value: T): Promise<void> {
    return setValueToArea("local", key, value);
}

export async function getSyncValue<T>(key: string, fallback: T): Promise<T> {
    return getValueFromArea("sync", key, fallback);
}

export async function setSyncValue<T>(key: string, value: T): Promise<void> {
    return setValueToArea("sync", key, value);
}

export async function getSessionValue<T>(key: string, fallback: T): Promise<T> {
    return getValueFromArea("session", key, fallback);
}

export async function setSessionValue<T>(key: string, value: T): Promise<void> {
    return setValueToArea("session", key, value);
}

export async function removeSessionValue(key: string): Promise<void> {
    return removeValueFromArea("session", key);
}

export async function removeSessionValuesByPrefix(prefix: string): Promise<void> {
    return removeValuesByPrefixFromArea("session", prefix);
}

// Backward-compatible local storage aliases used by existing features.
export async function getStoredValue<T>(key: string, fallback: T): Promise<T> {
    return getLocalValue(key, fallback);
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
    return setLocalValue(key, value);
}

// Redux Persist storage adapter backed by chrome.storage.sync.
export const chromeSyncReduxStorage = {
    async getItem(key: string): Promise<string | null> {
        const value = await getSyncValue<unknown>(key, null);
        if (typeof value === "string" || value === null) return value;
        return JSON.stringify(value);
    },

    async setItem(key: string, value: string): Promise<void> {
        await setSyncValue(key, value);
    },

    async removeItem(key: string): Promise<void> {
        await removeValueFromArea("sync", key);
    },
};
