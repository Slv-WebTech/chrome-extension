export interface SearchEngine {
  id: string;
  name: string;
  /** `%s` is replaced with the URL-encoded query. */
  url: string;
  /** Prefix shortcut, e.g. `!yt cats`. */
  bang: string;
}

export const SEARCH_ENGINES: readonly SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s', bang: 'g' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', bang: 'd' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s', bang: 'b' },
  { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q=%s', bang: 'br' },
  { id: 'startpage', name: 'Startpage', url: 'https://www.startpage.com/do/search?q=%s', bang: 'sp' },
  { id: 'ecosia', name: 'Ecosia', url: 'https://www.ecosia.org/search?q=%s', bang: 'e' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s', bang: 'yt' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=%s', bang: 'gh' },
  { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', bang: 'so' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search=%s', bang: 'w' },
  { id: 'maps', name: 'Google Maps', url: 'https://www.google.com/maps/search/%s', bang: 'm' },
];

export const CUSTOM_ENGINE_ID = 'custom';
export const DEFAULT_ENGINE_ID = 'google';

/** A custom template must be https and contain the %s placeholder. */
export function isValidCustomTemplate(template: string): boolean {
  if (!template.startsWith('https://') || !template.includes('%s')) return false;
  try {
    new URL(template.replace('%s', 'test'));
    return true;
  } catch {
    return false;
  }
}

export function getEngine(id: string, customTemplate = ''): SearchEngine {
  if (id === CUSTOM_ENGINE_ID && isValidCustomTemplate(customTemplate)) {
    return { id: CUSTOM_ENGINE_ID, name: 'Custom', url: customTemplate, bang: 'c' };
  }
  return SEARCH_ENGINES.find((engine) => engine.id === id) ?? SEARCH_ENGINES[0]!;
}

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return engine.url.replace('%s', encodeURIComponent(query));
}

const DOMAIN_LIKE = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d{2,5})?(?:[/?#]\S*)?$/i;
const LOCALHOST_LIKE = /^localhost(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export interface ResolvedSearch {
  kind: 'url' | 'search';
  url: string;
  engine: SearchEngine;
  query: string;
}

/**
 * Decide where Enter goes: a direct URL, a bang-prefixed engine ("!yt lofi"),
 * or the selected search engine. Only http(s) targets are ever produced.
 */
export function resolveSearch(input: string, engineId: string, customTemplate = ''): ResolvedSearch | null {
  let text = input.trim();
  if (!text) return null;

  let engine = getEngine(engineId, customTemplate);

  const bangMatch = /^!(\S+)\s+(.+)$/.exec(text);
  if (bangMatch) {
    const [, bang, rest] = bangMatch;
    const matched = SEARCH_ENGINES.find((candidate) => candidate.bang === bang!.toLowerCase());
    if (matched && rest) {
      engine = matched;
      text = rest.trim();
    }
  }

  if (!/\s/.test(text)) {
    if (/^https?:\/\//i.test(text)) {
      try {
        const url = new URL(text);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return { kind: 'url', url: url.toString(), engine, query: text };
        }
      } catch {
        /* fall through to search */
      }
    } else if (DOMAIN_LIKE.test(text) || LOCALHOST_LIKE.test(text)) {
      return { kind: 'url', url: `https://${text}`, engine, query: text };
    }
  }

  return { kind: 'search', url: buildSearchUrl(engine, text), engine, query: text };
}

export const MAX_RECENT_SEARCHES = 8;

export function pushRecentSearch(list: readonly string[], query: string): string[] {
  const q = query.trim();
  if (!q) return [...list];
  return [q, ...list.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
}
