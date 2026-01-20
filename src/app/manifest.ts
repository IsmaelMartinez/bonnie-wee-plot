import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bonnie Wee Plot",
    short_name: "Bonnie Plot",
    description:
      "Plan your Scottish garden, track plantings across seasons, and get AI-powered growing advice for our climate",
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
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
