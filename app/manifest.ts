import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaidPrime — Dividend Income Dashboard",
    short_name: "PaidPrime",
    description:
      "Track holdings, dividend calendars, portfolio diversification, and incoming dividend payments.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B", // --bg-base
    theme_color: "#14532D", // --green-900
    icons: [
      {
        src: "/icons/manifest-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/manifest-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/manifest-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/manifest-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
