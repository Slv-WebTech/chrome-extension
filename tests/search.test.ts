import { describe, expect, it } from 'vitest';
import { buildSearchUrl, getEngine, isValidCustomTemplate, pushRecentSearch, resolveSearch } from '@/lib/search';

describe('resolveSearch', () => {
  it('returns null for blank input', () => {
    expect(resolveSearch('   ', 'google')).toBeNull();
  });

  it('searches with the selected engine and encodes the query', () => {
    const r = resolveSearch('cats & dogs', 'duckduckgo')!;
    expect(r.kind).toBe('search');
    expect(r.url).toBe('https://duckduckgo.com/?q=cats%20%26%20dogs');
  });

  it('treats domain-like input as a URL', () => {
    expect(resolveSearch('github.com/vercel/next.js', 'google')).toMatchObject({ kind: 'url', url: 'https://github.com/vercel/next.js' });
    expect(resolveSearch('localhost:3000', 'google')).toMatchObject({ kind: 'url', url: 'https://localhost:3000' });
    expect(resolveSearch('https://example.com/a?b=1', 'google')).toMatchObject({ kind: 'url', url: 'https://example.com/a?b=1' });
  });

  it('does not treat sentences or odd tokens as URLs', () => {
    expect(resolveSearch('what is example.com', 'google')!.kind).toBe('search');
    expect(resolveSearch('notes.txt1', 'google')!.kind).toBe('search');
  });

  it('never navigates to non-http(s) schemes', () => {
    for (const input of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'chrome://settings', 'file:///etc/passwd']) {
      const r = resolveSearch(input, 'google')!;
      expect(r.kind).toBe('search');
      expect(r.url.startsWith('https://www.google.com/search?q=')).toBe(true);
    }
  });

  it('supports bang prefixes for one-off engine switching', () => {
    expect(resolveSearch('!yt lofi beats', 'google')).toMatchObject({
      kind: 'search',
      url: 'https://www.youtube.com/results?search_query=lofi%20beats',
    });
    // unknown bang falls back to the normal engine with the full text
    expect(resolveSearch('!zzz hello', 'google')!.url).toBe('https://www.google.com/search?q=!zzz%20hello');
  });

  it('uses a valid custom engine template and ignores an invalid one', () => {
    const tpl = 'https://example.org/find?term=%s';
    expect(resolveSearch('x y', 'custom', tpl)!.url).toBe('https://example.org/find?term=x%20y');
    expect(getEngine('custom', 'http://insecure/%s').id).toBe('google');
  });
});

describe('helpers', () => {
  it('validates custom templates', () => {
    expect(isValidCustomTemplate('https://a.b/?q=%s')).toBe(true);
    expect(isValidCustomTemplate('https://a.b/?q=')).toBe(false);
    expect(isValidCustomTemplate('http://a.b/?q=%s')).toBe(false);
    expect(isValidCustomTemplate('javascript:%s')).toBe(false);
  });

  it('builds URLs', () => {
    expect(buildSearchUrl(getEngine('bing'), 'a b')).toBe('https://www.bing.com/search?q=a%20b');
  });

  it('keeps recent searches unique, newest first and capped at 8', () => {
    let list: string[] = [];
    for (const q of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) list = pushRecentSearch(list, q);
    expect(list).toHaveLength(8);
    expect(list[0]).toBe('i');
    expect(pushRecentSearch(list, 'F')[0]).toBe('F');
    expect(pushRecentSearch(list, 'F').filter((x) => x.toLowerCase() === 'f')).toHaveLength(1);
  });
});
