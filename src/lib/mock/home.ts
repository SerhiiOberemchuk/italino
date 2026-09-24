const SIPEC_CDN = "https://media.on-gadget.com/media/filer_public/";
const cdn = (path: string) => `${SIPEC_CDN}${path}`;

export type HomeBrand = (typeof homeBrands)[number];

/** Редакційні бренд-блоки; каталог товарів і категорій завжди надходить із CRM. */
export const homeBrands = [
  {
    slug: "handle-bags",
    name: "Handle Bags",
    tagline: "Сумки та шопери",
    text: "Шопери та сумки із сертифікованої бавовни, джуту, паперу й переробленого PET.",
    href: "/catalog?q=Handle",
    image: cdn("d3/91/d391f5e3-32f0-469e-b654-c3bcb4663422/handle_brand_homepage_new.jpg"),
  },
  {
    slug: "demi-design-milano",
    name: "DEMI Design Milano",
    tagline: "Міський дизайн",
    text: "Рюкзаки, сумки для ноутбука, несесери й дорожні аксесуари з продуманими деталями.",
    href: "/catalog?q=DEMI",
    image: cdn("1e/8d/1e8df668-220e-494c-b9c4-a1003dcaef39/demi_brand_homepage.jpg"),
  },
  {
    slug: "utopic",
    name: "Utopic",
    tagline: "Базовий одяг",
    text: "Одяг з органічної та переробленої бавовни для повсякденних і корпоративних образів.",
    href: "/catalog?q=Utopic",
    image: cdn("fb/fb/fbfb5b32-e614-456a-9c3a-cff5b4091aa8/utopic_brand_homepage.jpg"),
  },
] as const;
