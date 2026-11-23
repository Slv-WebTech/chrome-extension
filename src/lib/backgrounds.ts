/** Built-in, offline backgrounds (pure CSS gradients — no network, no assets). */
export interface BackgroundPreset {
  id: string;
  name: string;
  dark: string;
  light: string;
}

const layers = (a: string, b: string, c: string, base: string) =>
  `radial-gradient(60% 50% at 12% 18%, ${a} 0%, transparent 70%), radial-gradient(55% 55% at 88% 12%, ${b} 0%, transparent 72%), radial-gradient(70% 60% at 60% 100%, ${c} 0%, transparent 75%), ${base}`;

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    dark: layers('rgba(99,102,241,.55)', 'rgba(16,185,129,.40)', 'rgba(14,165,233,.35)', '#070b1a'),
    light: layers('rgba(129,140,248,.55)', 'rgba(52,211,153,.45)', 'rgba(125,211,252,.55)', '#eef2ff'),
  },
  {
    id: 'sunset',
    name: 'Sunset',
    dark: layers('rgba(244,63,94,.50)', 'rgba(251,146,60,.40)', 'rgba(168,85,247,.38)', '#14060f'),
    light: layers('rgba(251,113,133,.50)', 'rgba(253,186,116,.55)', 'rgba(216,180,254,.55)', '#fff1f2'),
  },
  {
    id: 'ocean',
    name: 'Ocean',
    dark: layers('rgba(6,182,212,.50)', 'rgba(37,99,235,.45)', 'rgba(20,184,166,.32)', '#04111c'),
    light: layers('rgba(103,232,249,.55)', 'rgba(147,197,253,.60)', 'rgba(94,234,212,.45)', '#ecfeff'),
  },
  {
    id: 'forest',
    name: 'Forest',
    dark: layers('rgba(34,197,94,.42)', 'rgba(132,204,22,.30)', 'rgba(20,184,166,.30)', '#06120c'),
    light: layers('rgba(134,239,172,.55)', 'rgba(190,242,100,.45)', 'rgba(94,234,212,.45)', '#f0fdf4'),
  },
  {
    id: 'orchid',
    name: 'Orchid',
    dark: layers('rgba(192,38,211,.45)', 'rgba(99,102,241,.45)', 'rgba(244,114,182,.30)', '#0f0716'),
    light: layers('rgba(232,121,249,.45)', 'rgba(165,180,252,.55)', 'rgba(249,168,212,.50)', '#fdf4ff'),
  },
  {
    id: 'ember',
    name: 'Ember',
    dark: layers('rgba(245,158,11,.40)', 'rgba(239,68,68,.40)', 'rgba(234,88,12,.30)', '#130a05'),
    light: layers('rgba(252,211,77,.55)', 'rgba(252,165,165,.55)', 'rgba(253,186,116,.50)', '#fffbeb'),
  },
  {
    id: 'graphite',
    name: 'Graphite',
    dark: layers('rgba(148,163,184,.22)', 'rgba(100,116,139,.22)', 'rgba(71,85,105,.25)', '#0a0c11'),
    light: layers('rgba(203,213,225,.65)', 'rgba(226,232,240,.70)', 'rgba(148,163,184,.35)', '#f8fafc'),
  },
];

export const DEFAULT_BACKGROUND_ID = 'aurora';

export function getPreset(id: string): BackgroundPreset {
  return BACKGROUND_PRESETS.find((preset) => preset.id === id) ?? BACKGROUND_PRESETS[0]!;
}

export interface RemoteBackground {
  url: string;
  credit: string;
  creditUrl: string;
  /** Unsplash requires pinging the download endpoint when an image is used. */
  trackUrl?: string;
}

const UNSPLASH_UTM = 'utm_source=momentum_dashboard&utm_medium=referral';

async function getJson<T>(url: string, headers: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

interface UnsplashPhoto {
  urls: { regular: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

export async function fetchUnsplash(accessKey: string, query: string, signal?: AbortSignal): Promise<RemoteBackground> {
  const q = encodeURIComponent(query || 'landscape');
  const photo = await getJson<UnsplashPhoto>(
    `https://api.unsplash.com/photos/random?query=${q}&orientation=landscape&content_filter=high`,
    { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
    signal,
  );
  return {
    url: photo.urls.regular,
    credit: `Photo by ${photo.user.name} on Unsplash`,
    creditUrl: `${photo.user.links.html}?${UNSPLASH_UTM}`,
    trackUrl: photo.links.download_location,
  };
}

/** Best-effort Unsplash "download" ping that their API guidelines ask for. */
export async function trackUnsplashUse(accessKey: string, trackUrl: string): Promise<void> {
  try {
    if (!trackUrl.startsWith('https://api.unsplash.com/')) return;
    await fetch(trackUrl, { headers: { Authorization: `Client-ID ${accessKey}` } });
  } catch {
    /* non-critical */
  }
}

interface PexelsResponse {
  photos: Array<{ src: { large2x: string; large: string }; photographer: string; photographer_url: string; url: string }>;
}

export async function fetchPexels(apiKey: string, query: string, signal?: AbortSignal): Promise<RemoteBackground> {
  const q = encodeURIComponent(query || 'landscape');
  const page = 1 + Math.floor(Math.random() * 10);
  const data = await getJson<PexelsResponse>(
    `https://api.pexels.com/v1/search?query=${q}&orientation=landscape&per_page=15&page=${page}`,
    { Authorization: apiKey },
    signal,
  );
  const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
  if (!photo) throw new Error('No photos found');
  return {
    url: photo.src.large2x || photo.src.large,
    credit: `Photo by ${photo.photographer} on Pexels`,
    creditUrl: photo.photographer_url,
  };
}

/** Verify that a URL is a loadable image *without* fetch() (keeps the strict connect-src CSP). */
export function probeImage(url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => finish(false), timeoutMs);
    function finish(ok: boolean) {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    }
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}

/** Downscale an uploaded image to a JPEG data URL small enough for chrome.storage.local. */
export async function fileToBackgroundDataUrl(file: File, maxWidth = 1920, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
