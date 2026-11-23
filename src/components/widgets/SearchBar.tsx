'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Clock, Search, X } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { CUSTOM_ENGINE_ID, SEARCH_ENGINES, getEngine, pushRecentSearch, resolveSearch } from '@/lib/search';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRecentSearches, updateSearchSettings } from '@/store/slices/settings';
import { cn } from '@/lib/utils';
import { IconButton } from '../ui/primitives';

export const SEARCH_INPUT_ID = 'search-input';

export function SearchBar() {
  const dispatch = useAppDispatch();
  const { engine: engineId, customUrl, rememberRecent, recent } = useAppSelector((s) => s.settings.search);
  const engine = getEngine(engineId, customUrl);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const go = (text: string) => {
    const result = resolveSearch(text, engineId, customUrl);
    if (!result) return;
    if (rememberRecent && result.kind === 'search') dispatch(setRecentSearches(pushRecentSearch(recent, result.query)));
    window.location.assign(result.url);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(query);
  };

  const engines = [
    ...SEARCH_ENGINES,
    ...(getEngine(CUSTOM_ENGINE_ID, customUrl).id === CUSTOM_ENGINE_ID ? [getEngine(CUSTOM_ENGINE_ID, customUrl)] : []),
  ];

  const showRecent = rememberRecent && recent.length > 0 && query === '' && focused;

  return (
    <form
      ref={formRef}
      role="search"
      aria-label="Web search"
      onSubmit={onSubmit}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!formRef.current?.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <div className="glass flex h-14 items-center gap-1 rounded-full pr-2 pl-2 transition-shadow focus-within:shadow-[0_0_0_2px_var(--accent)]">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`Search engine: ${engine.name}. Change`}
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-fg hover:bg-accent-soft"
            >
              <Search className="size-4 text-accent-text" aria-hidden />
              <span className="hidden sm:inline">{engine.name}</span>
              <ChevronDown className="size-3.5 text-fg-muted" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={8}
              className="glass animate-pop z-50 max-h-80 min-w-52 overflow-y-auto rounded-2xl bg-surface-solid p-1.5 shadow-glass"
              style={{ background: 'var(--surface-solid)' }}
            >
              <DropdownMenu.Label className="px-2.5 py-1.5 text-[0.7rem] font-semibold tracking-wider text-fg-muted uppercase">
                Search with
              </DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={engineId} onValueChange={(value) => dispatch(updateSearchSettings({ engine: value }))}>
                {engines.map((item) => (
                  <DropdownMenu.RadioItem
                    key={item.id}
                    value={item.id}
                    className="flex cursor-pointer items-center justify-between gap-6 rounded-lg px-2.5 py-2 text-sm text-fg outline-none data-[highlighted]:bg-accent-soft"
                  >
                    <span>{item.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[0.7rem] text-fg-muted">!{item.bang}</span>
                      <DropdownMenu.ItemIndicator>
                        <Check className="size-4 text-accent-text" aria-hidden />
                      </DropdownMenu.ItemIndicator>
                    </span>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          Search the web or enter a URL
        </label>
        <input
          id={SEARCH_INPUT_ID}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${engine.name} or type a URL`}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-base text-fg outline-none placeholder:text-fg-muted"
        />
        {query && (
          <IconButton label="Clear search" size="sm" onClick={() => setQuery('')}>
            <X className="size-4" aria-hidden />
          </IconButton>
        )}
        <button
          type="submit"
          aria-label="Search"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-fg transition-[filter,transform] hover:brightness-110 active:scale-95"
        >
          <Search className="size-4.5" aria-hidden />
        </button>
      </div>

      {showRecent && (
        <div className="glass animate-pop absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl bg-surface-solid p-2" style={{ background: 'var(--surface-solid)' }}>
          <p className="px-2.5 pt-1 pb-1.5 text-[0.7rem] font-semibold tracking-wider text-fg-muted uppercase">Recent</p>
          <ul>
            {recent.map((item) => (
              <li key={item} className="flex items-center">
                <button
                  type="button"
                  onClick={() => go(item)}
                  className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-fg hover:bg-accent-soft')}
                >
                  <Clock className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
                  <span className="truncate">{item}</span>
                </button>
                <IconButton
                  label={`Remove "${item}" from recent searches`}
                  size="sm"
                  onClick={() => dispatch(setRecentSearches(recent.filter((r) => r !== item)))}
                >
                  <X className="size-3.5" aria-hidden />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
