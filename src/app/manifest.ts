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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
