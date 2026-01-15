import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Community Allotment",
    short_name: "Allotment",
    description:
      "Plan your allotment garden, track plantings across seasons, and get AI-powered gardening advice",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#5c6e49",
    orientation: "portrait-primary",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
