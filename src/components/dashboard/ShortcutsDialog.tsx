'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { IconButton, Kbd } from '../ui/primitives';

const GLOBAL = [
  { keys: ['Ctrl', 'K'], label: 'Open the command palette (⌘K on Mac)' },
  { keys: ['Esc'], label: 'Close any dialog or palette' },
];
const SINGLE = [
  { keys: ['/'], label: 'Focus the search bar' },
  { keys: ['n'], label: 'New task' },
  { keys: ['f'], label: 'Start / pause the focus timer' },
  { keys: ['d'], label: 'Toggle light / dark theme' },
  { keys: [','], label: 'Open settings' },
  { keys: ['?'], label: 'Show this list' },
];
const SEARCH = [
  { keys: ['!yt', 'text'], label: 'Search YouTube once (also !gh, !w, !so, !d, !b …)' },
  { keys: ['Enter'], label: 'Search, or open a typed address directly' },
];

function Group({ title, items }: { title: string; items: Array<{ keys: string[]; label: string }> }) {
  return (
    <section>
      <h3 className="mb-1 text-[0.7rem] font-semibold tracking-wider text-fg-muted uppercase">{title}</h3>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-fg">{item.label}</span>
            <span className="flex shrink-0 gap-1">
              {item.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="glass animate-pop fixed top-1/2 left-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-card p-6"
          style={{ background: 'var(--surface-solid)' }}
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-fg">Keyboard shortcuts</Dialog.Title>
              <Dialog.Description className="text-sm text-fg-muted">Single-key shortcuts can be turned off in Settings.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close">
                <X className="size-4" aria-hidden />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className="space-y-4">
            <Group title="Anywhere" items={GLOBAL} />
            <Group title="When not typing" items={SINGLE} />
            <Group title="Search bar" items={SEARCH} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
