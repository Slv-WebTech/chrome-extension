'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { IconButton } from '../ui/primitives';
import { SettingsContent } from './SettingsContent';

export function SettingsDrawer({
  open,
  onOpenChange,
  onOpenShortcuts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcuts: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className="glass fixed inset-y-0 right-0 z-50 flex w-[min(100vw,30rem)] flex-col rounded-l-card border-r-0"
          style={{ background: 'var(--surface-solid)', animation: 'slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-fg">Settings</Dialog.Title>
              <Dialog.Description className="text-xs text-fg-muted">Changes are saved automatically.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close settings">
                <X className="size-5" aria-hidden />
              </IconButton>
            </Dialog.Close>
          </header>
          <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <SettingsContent
              onOpenShortcuts={() => {
                onOpenChange(false);
                onOpenShortcuts();
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
