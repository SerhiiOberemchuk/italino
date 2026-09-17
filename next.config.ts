import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  images: {
    remotePatterns: [
      // CDN каталогу Sipec: фото товарів приходять у CRM хот-лінками саме звідси.
      { protocol: "https", hostname: "media.on-gadget.com" },
    ],
  },
};

export default nextConfig;
