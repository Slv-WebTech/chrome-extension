'use client';

import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Background } from '../dashboard/Background';
import { ShortcutsDialog } from '../dashboard/ShortcutsDialog';
import { SettingsContent } from './SettingsContent';

/** Full-page settings (the extension "Options" page). The same content also lives in the dashboard drawer. */
export function SettingsPage() {
  const [shortcuts, setShortcuts] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return (
    <>
      <Background />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-on-bg text-3xl font-semibold tracking-tight text-fg">Settings</h1>
            <p className="text-on-bg mt-1 text-sm text-fg-muted">Momentum Dashboard · changes are saved automatically</p>
          </div>
          <a
            href={`${basePath}/`}
            className="glass inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-fg hover:bg-accent-soft"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to dashboard
          </a>
        </header>
        <SettingsContent onOpenShortcuts={() => setShortcuts(true)} />
      </main>
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </>
  );
}
