'use client';

import { MotionConfig } from 'framer-motion';
import { type ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import { makeStore } from '@/store';
import { startPersistence } from '@/store/persistence';

/** One store per page. Popup, new tab and settings each load their own and stay in sync via storage events. */
const appStore = makeStore();

function useDocumentSettings() {
  const hydrated = useAppSelector((s) => s.meta.hydrated);
  const theme = useAppSelector((s) => s.settings.theme);
  const accent = useAppSelector((s) => s.settings.accent);
  const reduceMotion = useAppSelector((s) => s.settings.reduceMotion);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.accent = accent;
    root.dataset.motion = reduceMotion === 'on' ? 'reduce' : reduceMotion === 'off' ? 'full' : 'system';

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      root.dataset.theme = theme === 'system' ? (query.matches ? 'dark' : 'light') : theme;
    };
    apply();
    if (theme !== 'system') return;
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [hydrated, theme, accent, reduceMotion]);
}

function Shell({ children }: { children: ReactNode }) {
  useDocumentSettings();
  const reduceMotion = useAppSelector((s) => s.settings.reduceMotion);
  const theme = useAppSelector((s) => s.settings.theme);
  return (
    <MotionConfig reducedMotion={reduceMotion === 'on' ? 'always' : reduceMotion === 'off' ? 'never' : 'user'}>
      {children}
      <Toaster
        position="bottom-center"
        theme={theme === 'system' ? 'system' : theme}
        toastOptions={{ classNames: { toast: '!rounded-2xl !border-line' } }}
      />
    </MotionConfig>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    let disposed = false;
    let dispose: (() => void) | undefined;
    void startPersistence(appStore).then((stop) => {
      if (disposed) stop();
      else dispose = stop;
    });
    return () => {
      disposed = true;
      dispose?.();
    };
  }, []);

  return (
    <Provider store={appStore}>
      <Shell>{children}</Shell>
    </Provider>
  );
}

/** Renders children only after persisted state has loaded, avoiding a flash of default content. */
export function HydrationGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useAppSelector((s) => s.meta.hydrated);
  return <>{hydrated ? children : fallback}</>;
}
