/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  // Conditionally enable static export for GitHub Pages
  ...(isGitHubPages && { output: 'export' }),
  
  // Base path for GitHub Pages (repo name)
  basePath: isGitHubPages ? '/community-allotment' : '',
  
  // Asset prefix for GitHub Pages
  assetPrefix: isGitHubPages ? '/community-allotment/' : '',
  
  // Image configuration
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  // Trailing slash for better compatibility with static hosting
  trailingSlash: true,

  // Server Actions configuration (for non-static builds)
  ...(!isGitHubPages && {
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb', // Limit request body size
      },
    },
  }),
};

module.exports = nextConfig;
