import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  cacheComponents: true,
  /*
   * Запасний зворотний маршрут платіжного провайдера. Редірект саме тут, а не
   * сторінкою з `redirect()`: Cache Components пререндерять оболонку будь-якої
   * сторінки, і редірект поїхав би в потоці — браузер отримав би 200 з
   * «Завантажуємо…» і перейшов лише після гідрації. Провайдер повертає
   * покупця повним перезавантаженням, тож потрібен звичайний HTTP-редірект.
   */
  async redirects() {
    return [
      {
        source: "/checkout/success/:orderId",
        destination: "/order/:orderId",
        permanent: false,
      },
    ];
  },
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
