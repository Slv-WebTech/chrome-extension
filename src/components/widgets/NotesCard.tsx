'use client';

import { NotebookPen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { MAX_NOTE_LENGTH, setNotes } from '@/store/slices/notes';
import { Card } from '../ui/primitives';

export const NOTES_INPUT_ID = 'notes-input';

export function NotesCard() {
  const dispatch = useAppDispatch();
  const stored = useAppSelector((s) => s.notes);
  const [draft, setDraft] = useState(stored.text);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(draft);

  // Accept updates written by another window/popup while the user is not typing.
  useEffect(() => {
    if (!dirty.current && stored.text !== latest.current) {
      latest.current = stored.text;
      setDraft(stored.text);
    }
  }, [stored.text]);

  const commit = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    if (dirty.current) {
      dirty.current = false;
      dispatch(setNotes(latest.current));
    }
  };

  useEffect(
    () => () => {
      if (dirty.current) dispatch(setNotes(latest.current));
      if (timer.current) clearTimeout(timer.current);
    },
    [dispatch],
  );

  const onChange = (value: string) => {
    latest.current = value;
    dirty.current = true;
    setDraft(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(commit, 500);
  };

  return (
    <Card id="notes" title="Scratchpad" icon={<NotebookPen className="size-4" aria-hidden />} className="min-h-[16rem]">
      <label htmlFor={NOTES_INPUT_ID} className="sr-only">
        Notes — saved automatically on this device
      </label>
      <textarea
        id={NOTES_INPUT_ID}
        value={draft}
        onChange={(event) => onChange(event.target.value)}
        onBlur={commit}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Jot something down… it saves automatically."
        spellCheck
        className="scroll-thin min-h-40 w-full flex-1 resize-none rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-fg placeholder:text-fg-muted/80 focus-visible:border-accent-text"
      />
      <p className="mt-2 flex justify-between text-[0.7rem] text-fg-muted tabular" aria-live="polite">
        <span>{stored.updatedAt ? `Saved ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(stored.updatedAt)}` : 'Stored locally'}</span>
        <span>{draft.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}</span>
      </p>
    </Card>
  );
}
