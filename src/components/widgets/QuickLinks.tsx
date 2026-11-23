'use client';

import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { hostnameOf, normalizeHttpUrl } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { MAX_LINKS, type QuickLink, addLink, moveLink, removeLink, updateLink } from '@/store/slices/links';
import { Button, Field, IconButton, TextInput } from '../ui/primitives';

const HUES = [250, 200, 160, 340, 30, 280, 190, 10];

function hueFor(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length] ?? 250;
}

/** Colourful letter tile — avoids third-party favicon services, so no browsing data leaves the device. */
function Tile({ link }: { link: QuickLink }) {
  const host = hostnameOf(link.url);
  const hue = hueFor(host);
  return (
    <span
      aria-hidden
      className="flex size-12 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-md"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 58%), hsl(${(hue + 40) % 360} 75% 42%))` }}
    >
      {(link.title || host).charAt(0).toUpperCase()}
    </span>
  );
}

function LinkDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: QuickLink | null;
}) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeHttpUrl(url);
    if (!normalized) {
      setError('Enter a valid web address, e.g. example.com');
      return;
    }
    if (initial) dispatch(updateLink({ id: initial.id, title, url: normalized }));
    else dispatch(addLink({ title, url: normalized }));
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="glass animate-pop fixed top-1/2 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-card p-6"
          style={{ background: 'var(--surface-solid)' }}
        >
          <Dialog.Title className="text-lg font-semibold text-fg">{initial ? 'Edit shortcut' : 'Add shortcut'}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-fg-muted">Shortcuts open in this tab.</Dialog.Description>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Name">
              {(id) => <TextInput id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="GitHub" autoFocus />}
            </Field>
            <Field label="Address">
              {(id) => (
                <TextInput
                  id={id}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  placeholder="https://github.com"
                  inputMode="url"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'link-error' : undefined}
                />
              )}
            </Field>
            {error && (
              <p id="link-error" role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Button type="submit" variant="primary">
                {initial ? 'Save' : 'Add'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function QuickLinks({ compact = false }: { compact?: boolean }) {
  const dispatch = useAppDispatch();
  const links = useAppSelector((s) => s.links.items);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; link: QuickLink | null }>({ open: false, link: null });

  return (
    <nav aria-label="Quick links" className="mx-auto w-full max-w-4xl">
      <ul className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3 sm:gap-x-4">
        {links.map((link, index) => (
          <li key={link.id} className="relative w-[4.75rem] text-center sm:w-20">
            <a
              href={link.url}
              className="group flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-transform hover:-translate-y-0.5"
              aria-label={editing ? undefined : link.title}
              tabIndex={editing ? -1 : 0}
              onClick={(event) => {
                if (editing) event.preventDefault();
              }}
            >
              <Tile link={link} />
              <span className="text-on-bg line-clamp-1 w-full text-xs font-medium text-fg">{link.title}</span>
            </a>
            {editing && (
              <div className="glass absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full p-0.5" style={{ background: 'var(--surface-solid)' }}>
                <IconButton label={`Move ${link.title} left`} size="sm" disabled={index === 0} onClick={() => dispatch(moveLink({ id: link.id, direction: -1 }))}>
                  <ArrowLeft className="size-3.5" aria-hidden />
                </IconButton>
                <IconButton label={`Edit ${link.title}`} size="sm" onClick={() => setDialog({ open: true, link })}>
                  <Pencil className="size-3.5" aria-hidden />
                </IconButton>
                <IconButton label={`Remove ${link.title}`} size="sm" onClick={() => dispatch(removeLink(link.id))}>
                  <Trash2 className="size-3.5 text-danger" aria-hidden />
                </IconButton>
                <IconButton label={`Move ${link.title} right`} size="sm" disabled={index === links.length - 1} onClick={() => dispatch(moveLink({ id: link.id, direction: 1 }))}>
                  <ArrowRight className="size-3.5" aria-hidden />
                </IconButton>
              </div>
            )}
          </li>
        ))}
        {links.length < MAX_LINKS && (
          <li className="w-[4.75rem] text-center sm:w-20">
            <button
              type="button"
              onClick={() => setDialog({ open: true, link: null })}
              className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-transform hover:-translate-y-0.5"
              aria-label="Add shortcut"
            >
              <span className="glass flex size-12 items-center justify-center rounded-2xl text-fg">
                <Plus className="size-5" aria-hidden />
              </span>
              <span className="text-on-bg text-xs font-medium text-fg">Add</span>
            </button>
          </li>
        )}
      </ul>
      {!compact && links.length > 0 && (
        <div className="mt-1 flex justify-center">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            aria-pressed={editing}
            className="text-on-bg cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-fg-muted hover:text-fg"
          >
            {editing ? 'Done editing' : 'Edit shortcuts'}
          </button>
        </div>
      )}
      {dialog.open && (
        <LinkDialog
          key={dialog.link?.id ?? 'new'}
          open
          initial={dialog.link}
          onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        />
      )}
    </nav>
  );
}
