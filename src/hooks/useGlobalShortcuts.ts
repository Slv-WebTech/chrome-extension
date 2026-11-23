'use client';

import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  palette: () => void;
  search: () => void;
  newTask: () => void;
  toggleTimer: () => void;
  toggleTheme: () => void;
  settings: () => void;
  help: () => void;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Ctrl/⌘+K always opens the palette. Single-key shortcuts only fire when the user is not
 * typing and no dialog is open, and can be disabled entirely (WCAG 2.1.4).
 */
export function useGlobalShortcuts(handlers: ShortcutHandlers, singleKey: boolean) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        ref.current.palette();
        return;
      }
      if (!singleKey || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target) || document.querySelector('[role="dialog"]')) return;

      const run = (fn: () => void) => {
        event.preventDefault();
        fn();
      };
      switch (event.key) {
        case '/':
          return run(ref.current.search);
        case 'n':
          return run(ref.current.newTask);
        case 'f':
          return run(ref.current.toggleTimer);
        case 'd':
          return run(ref.current.toggleTheme);
        case ',':
          return run(ref.current.settings);
        case '?':
          return run(ref.current.help);
        default:
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [singleKey]);
}
