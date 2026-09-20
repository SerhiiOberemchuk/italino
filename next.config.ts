import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.on-gadget.com" },
      {
        protocol: "https",
        hostname: "w99cualo4tspebtl.public.blob.vercel-storage.com",
        pathname: "/workspaces/tbjcDiJpZCs065xbRAjUi0kiZBVS0d3O/products/**",
      },
    ],
  },
};

export default nextConfig;
