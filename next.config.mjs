import { spawnSync } from "node:child_process";
import withBundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs/config";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/bonnie-wee-plot" : "";

// Get git revision for cache busting, fallback to random UUID
const getRevision = () => {
  try {
    const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
    return result.stdout?.trim() || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: `${basePath}/~offline`, revision: getRevision() }],
  // Disable in development to avoid cache issues
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // Conditionally enable static export for GitHub Pages
  ...(isGitHubPages && { output: "export" }),

  // Base path for GitHub Pages (repo name)
  basePath,

  // Asset prefix for GitHub Pages
  assetPrefix: isGitHubPages ? "/bonnie-wee-plot/" : "",

  // Image configuration — only disable optimization for static export (GitHub Pages)
  images: {
    unoptimized: isGitHubPages,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Trailing slash for static hosting compatibility (GitHub Pages)
  trailingSlash: isGitHubPages,

  // Enable Turbopack (Next.js 16+ default) - empty config silences webpack warning
  turbopack: {},

  // Server Actions configuration (for non-static builds)
  ...(!isGitHubPages && {
    experimental: {
      serverActions: {
        bodySizeLimit: "10mb",
      },
    },
  }),
};

// Sentry configuration for source maps and error tracking
const sentryConfig = {
  // For all available options, see the SentryBuildOptions type exported from "@sentry/nextjs/config"

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production builds with Sentry configured
  silent: !process.env.SENTRY_DSN,

  // Upload source maps to Sentry for production debugging
  widenClientFileUpload: true,

  // Tree-shake Sentry SDK debug logger statements to reduce bundle size
  // (replaces the `disableLogger` option removed in @sentry/nextjs v11; works for Turbopack and webpack)
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },

  // Do not create Sentry cron monitors for Vercel Cron Jobs
  // (moved under `webpack` in @sentry/nextjs v11; false is the default)
  webpack: {
    automaticVercelMonitors: false,
  },
};

// Apply Serwist first, then Sentry
const configWithSerwist = withSerwist(nextConfig);

// Only apply Sentry wrapper if DSN is configured (skip for GitHub Pages static export)
const finalConfig = process.env.SENTRY_DSN && !isGitHubPages
  ? withSentryConfig(configWithSerwist, sentryConfig)
  : configWithSerwist;

export default withAnalyzer(finalConfig);
