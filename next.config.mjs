import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

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

export default withSerwist(nextConfig);
