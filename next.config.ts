import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Two static-export targets share one codebase:
 *
 *  - extension (default): served from the extension root, no base path. The
 *    `scripts/postbuild-extension.mjs` step then makes `out/` Chrome-loadable.
 *  - web: the optional hosted demo on GitHub Pages (served under /<repo>).
 */
const isWeb = process.env.BUILD_TARGET === 'web';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'chrome-extension';
const basePath = isWeb && process.env.GITHUB_ACTIONS === 'true' ? `/${repo}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_BUILD_TARGET: isWeb ? 'web' : 'extension',
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
