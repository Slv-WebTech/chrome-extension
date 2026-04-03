import type { NextConfig } from "next";

const isStaticExport = process.env.BUILD_TARGET === 'static';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const githubPagesBasePath = isStaticExport && process.env.GITHUB_ACTIONS === 'true' && repoName
  ? `/${repoName}`
  : '';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  images: {
    unoptimized: isStaticExport,
  },
  trailingSlash: isStaticExport,
  basePath: githubPagesBasePath || undefined,
  assetPrefix: githubPagesBasePath || undefined,
};

export default nextConfig;
