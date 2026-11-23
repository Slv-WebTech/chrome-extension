import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');
interface Manifest {
  manifest_version: number;
  version: string;
  description: string;
  permissions?: string[];
  optional_permissions?: string[];
  host_permissions?: string[];
  content_scripts?: unknown;
  content_security_policy: { extension_pages: string };
  icons: Record<string, string>;
  chrome_url_overrides: { newtab: string };
  action: { default_popup: string };
  options_ui: { page: string };
  background: { service_worker: string };
}
const manifest = JSON.parse(readFileSync(path.join(root, 'public', 'manifest.json'), 'utf8')) as Manifest;
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };

describe('public/manifest.json', () => {
  it('is a valid Manifest V3 whose version tracks package.json', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.description.length).toBeLessThanOrEqual(132);
  });

  it('requests the minimum permissions and no host access', () => {
    expect(manifest.permissions).toEqual(['storage', 'alarms']);
    expect(manifest.optional_permissions).toEqual(['notifications']);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.content_scripts).toBeUndefined();
  });

  it('has a strict CSP: local scripts only, explicit connect-src allow-list', () => {
    const csp: string = manifest.content_security_policy.extension_pages;
    expect(csp).toMatch(/script-src 'self'(;|$)/);
    expect(csp).not.toMatch(/unsafe-eval|unsafe-inline/);
    const connect = csp.split(';').find((d) => d.trim().startsWith('connect-src')) ?? '';
    expect(connect).not.toContain('*');
    for (const origin of connect.split(/\s+/).filter((token) => token.startsWith('http'))) {
      expect(origin.startsWith('https://')).toBe(true);
    }
  });

  it('ships icons in every required size', () => {
    for (const size of ['16', '32', '48', '128']) {
      expect(existsSync(path.join(root, 'public', manifest.icons[size] ?? '__missing__')), `icon ${size}`).toBe(true);
    }
  });

  it('declares the new-tab override, popup, options page and service worker', () => {
    expect(manifest.chrome_url_overrides.newtab).toBe('index.html');
    expect(manifest.action.default_popup).toBe('popup/index.html');
    expect(manifest.options_ui.page).toBe('settings/index.html');
    expect(existsSync(path.join(root, 'public', manifest.background.service_worker))).toBe(true);
  });
});

describe('repository hygiene', () => {
  it('does not use NEXT_PUBLIC_* environment variables for secrets', () => {
    const config = readFileSync(path.join(root, 'next.config.ts'), 'utf8');
    expect(config).not.toMatch(/API_KEY|ACCESS_KEY|SECRET|TOKEN/i);
    const example = readFileSync(path.join(root, '.env.example'), 'utf8');
    expect(example).not.toMatch(/^[A-Z_]*(KEY|SECRET|TOKEN)[A-Z_]*=\S+/m);
  });
});
