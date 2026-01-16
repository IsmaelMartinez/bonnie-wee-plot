import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/community-allotment" : "";

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
  // Conditionally enable static export for GitHub Pages
  ...(isGitHubPages && { output: "export" }),

  // Base path for GitHub Pages (repo name)
  basePath,

  // Asset prefix for GitHub Pages
  assetPrefix: isGitHubPages ? "/community-allotment/" : "",

  // Image configuration
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Trailing slash for better compatibility with static hosting
  trailingSlash: true,

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
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production builds with Sentry configured
  silent: !process.env.SENTRY_DSN,

  // Upload source maps to Sentry for production debugging
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Prevents source map comments in production
  hideSourceMaps: true,

  // Automatically instrument client-side routes
  automaticVercelMonitors: false,
};

// Apply Serwist first, then Sentry
const configWithSerwist = withSerwist(nextConfig);

// Only apply Sentry wrapper if DSN is configured (skip for GitHub Pages static export)
const finalConfig = process.env.SENTRY_DSN && !isGitHubPages
  ? withSentryConfig(configWithSerwist, sentryConfig)
  : configWithSerwist;

export default finalConfig;
