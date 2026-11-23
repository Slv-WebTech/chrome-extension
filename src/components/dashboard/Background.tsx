'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { type RemoteBackground, fetchPexels, fetchUnsplash, getPreset, probeImage, trackUnsplashUse } from '@/lib/backgrounds';
import { dayKey } from '@/lib/datetime';
import { storageGet, storageSet } from '@/lib/storage';
import { useAppSelector } from '@/store/hooks';
import { UPLOAD_KEY } from '@/store/persistence';

const CACHE_KEY = 'momentum.cache.bg.v1';
export const REFRESH_BACKGROUND_EVENT = 'momentum:refresh-background';

interface BgCache {
  source: string;
  query: string;
  day: string;
  data: RemoteBackground;
}

/** Resolves the image URL (and credit) for the non-preset background kinds. */
function useImageSource(): RemoteBackground | null {
  const bg = useAppSelector((s) => s.settings.background);
  const unsplashKey = useAppSelector((s) => s.secrets.unsplashKey);
  const pexelsKey = useAppSelector((s) => s.secrets.pexelsKey);
  const [fetched, setFetched] = useState<{ kind: string; data: RemoteBackground | null } | null>(null);
  const warned = useRef(false);

  const { kind, query, customUrl } = bg;
  const key = kind === 'unsplash' ? unsplashKey : kind === 'pexels' ? pexelsKey : '';
  const needsLoad = kind === 'upload' || ((kind === 'unsplash' || kind === 'pexels') && key !== '');

  const load = useCallback(
    async (force: boolean, signal?: AbortSignal) => {
      if (kind === 'upload') {
        const data = await storageGet<string>(UPLOAD_KEY, '');
        if (!signal?.aborted) setFetched({ kind, data: data ? { url: data, credit: '', creditUrl: '' } : null });
        return;
      }
      if (kind !== 'unsplash' && kind !== 'pexels') return;
      const today = dayKey(Date.now());
      const cached = await storageGet<BgCache | null>(CACHE_KEY, null);
      if (signal?.aborted) return;
      if (!force && cached && cached.source === kind && cached.query === query && cached.day === today) {
        setFetched({ kind, data: cached.data });
        return;
      }
      try {
        const data = kind === 'unsplash' ? await fetchUnsplash(key, query, signal) : await fetchPexels(key, query, signal);
        if (signal?.aborted) return;
        setFetched({ kind, data });
        await storageSet(CACHE_KEY, { source: kind, query, day: today, data } satisfies BgCache).catch(() => undefined);
        if (kind === 'unsplash' && data.trackUrl) void trackUnsplashUse(key, data.trackUrl);
      } catch {
        if (signal?.aborted) return;
        setFetched({ kind, data: cached?.source === kind ? cached.data : null });
        if (!warned.current) {
          warned.current = true;
          toast.error('Could not load a background photo — check your API key in Settings.', { id: 'bg-error' });
        }
      }
    },
    [kind, query, key],
  );

  useEffect(() => {
    if (!needsLoad) return;
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after awaited storage/network reads
    void load(false, ctrl.signal);
    const onRefresh = () => void load(true);
    window.addEventListener(REFRESH_BACKGROUND_EVENT, onRefresh);
    return () => {
      ctrl.abort();
      window.removeEventListener(REFRESH_BACKGROUND_EVENT, onRefresh);
    };
  }, [load, needsLoad]);

  if (kind === 'custom') return customUrl ? { url: customUrl, credit: '', creditUrl: '' } : null;
  if (!needsLoad) return null;
  return fetched && fetched.kind === kind ? fetched.data : null;
}

export function Background() {
  const bg = useAppSelector((s) => s.settings.background);
  const preset = getPreset(bg.preset);
  const remote = useImageSource();
  const [probed, setProbed] = useState<{ url: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!remote?.url) return;
    let alive = true;
    const url = remote.url;
    void probeImage(url).then((ok) => {
      if (alive) setProbed({ url, ok });
    });
    return () => {
      alive = false;
    };
  }, [remote?.url]);

  const loadedUrl = remote?.url && probed?.url === remote.url && probed.ok ? remote.url : null;
  const hasImage = Boolean(loadedUrl);
  // Photos need a stronger scrim than gradients to keep text legible.
  const scrim = hasImage ? Math.max(bg.dim, 30) : bg.dim * 0.5;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="bg-layer absolute inset-0"
        style={{ '--bg-dark': preset.dark, '--bg-light': preset.light } as CSSProperties}
      />
      <AnimatePresence>
        {loadedUrl && (
          <motion.div
            key={loadedUrl}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${loadedUrl}")`, filter: bg.blur ? `blur(${bg.blur}px)` : undefined, transform: bg.blur ? 'scale(1.06)' : undefined }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 transition-colors duration-500" style={{ background: `rgba(var(--scrim), ${scrim / 100})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_40%,rgba(0,0,0,0.18)_100%)]" />
      {hasImage && remote?.credit && remote.creditUrl && (
        <a
          href={remote.creditUrl}
          className="pointer-events-auto absolute right-3 bottom-2 rounded-md bg-black/45 px-2 py-1 text-[0.68rem] text-white/90 backdrop-blur hover:bg-black/60"
        >
          {remote.credit}
        </a>
      )}
    </div>
  );
}
