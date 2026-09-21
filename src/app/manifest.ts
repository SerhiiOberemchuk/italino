import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Italino — товари з Італії",
    short_name: "Italino",
    description: "Товари зі складу в Італії з доставкою в Україну.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ee",
    theme_color: "#14110f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
