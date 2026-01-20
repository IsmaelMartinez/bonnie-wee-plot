import type { MetadataRoute } from "next";

// Required for static export (GitHub Pages)
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  // Use basePath for GitHub Pages deployment
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return {
    name: "Bonnie Wee Plot",
    short_name: "Bonnie Plot",
    description:
      "Plan your Scottish garden, track plantings across seasons, and get AI-powered growing advice for our climate",
    start_url: `${basePath}/`,
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#5c6e49",
    orientation: "portrait-primary",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: `${basePath}/icons/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-maskable-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
