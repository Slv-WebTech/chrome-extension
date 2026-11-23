'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Button } from './primitives';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm" />
        <Dialog.Content
          className="glass animate-pop fixed top-1/2 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-card p-6"
          style={{ background: 'var(--surface-solid)' }}
        >
          <Dialog.Title className="text-lg font-semibold text-fg">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-fg-muted">{description}</Dialog.Description>
          {children && <div className="mt-3">{children}</div>}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button
              variant={danger ? 'danger' : 'primary'}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
