import type { CrmProduct } from "@/lib/crm/types";

/**
 * Мок-дані головної сторінки у формі відповіді Obriym CRM (`GET /api/v1/products`).
 * Товари, коди моделей, кольори та фото — справжні позиції каталогу Sipec
 * (постачальник; його каталог імпортується в CRM). Назви перекладено, ціни в UAH
 * — плейсхолдери до налаштування курсу й націнки в CRM.
 */

const SIPEC_CDN = "https://media.on-gadget.com/media/filer_public/";
const cdn = (path: string) => `${SIPEC_CDN}${path}`;

type Seed = {
  /** Код моделі Sipec → `productGroupId` у CRM. */
  key: string;
  name: string;
  brand: string | null;
  image: string;
  price: number;
  compareAtPrice?: number;
  /** Кольори моделі (кожен колір × розмір = окремий артикул у Sipec і CRM). */
  colors: string[];
  /** Порожній масив — модель без розмірів (сумка, пляшка, ручка). */
  sizes: string[];
  material?: string;
  gender?: CrmProduct["gender"];
  tags?: string[];
  categoryId?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Розгортає модель у рядки-артикули, як їх віддає CRM після імпорту з Sipec. */
function expand(seed: Seed): CrmProduct[] {
  const colors: (string | null)[] = seed.colors.length ? seed.colors : [null];
  const sizes: (string | null)[] = seed.sizes.length ? seed.sizes : [null];
  const rows: CrmProduct[] = [];
  colors.forEach((color, colorIndex) => {
    for (const size of sizes) {
      const colorCode = String(colorIndex + 1).padStart(2, "0");
      const sku = `${seed.key.toUpperCase()}${colorCode}${size ?? ""}`;
      rows.push({
        id: sku.toLowerCase(),
        name: seed.name,
        sku,
        description: null,
        status: "active",
        availability: "in_stock",
        price: seed.price,
        compareAtPrice: seed.compareAtPrice ?? null,
        currency: "UAH",
        prices: [
          {
            currency: "UAH",
            price: seed.price,
            compareAtPrice: seed.compareAtPrice ?? null,
          },
        ],
        images: [{ url: seed.image }],
        brand: seed.brand ? { id: slugify(seed.brand), name: seed.brand } : null,
        category: seed.categoryId
          ? { id: seed.categoryId, name: null, parentId: null }
          : null,
        productGroupId: seed.key,
        size,
        sizeSystem: size ? "IT" : null,
        color,
        gender: seed.gender ?? null,
        material: seed.material ?? null,
        stock: null,
        tags: seed.tags ?? [],
        updatedAt: "2026-09-15T10:00:00.000Z",
      });
    }
  });
  return rows;
}

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const PRODUCT_SEEDS: Seed[] = [
  {
    key: "dm25102",
    name: "Рюкзак для подорожей Brera Travel з відділенням для ноутбука 15″",
    brand: "DEMI Design Milano",
    image: cdn("1a/b2/1ab27820-0738-4d13-8eea-a3295f499a73/dm25102_02.jpg"),
    price: 3290,
    colors: ["Чорний", "Синій", "Коричневий", "Темно-зелений"],
    sizes: [],
    material: "soft PU, водовідштовхувальний",
    tags: ["new"],
    categoryId: "bags",
  },
  {
    key: "ut23007",
    name: "Худі унісекс з переробленої бавовни та поліестеру, 280 г/м²",
    brand: "Utopic",
    image: cdn("24/ae/24ae4821-eaa3-4e0c-999f-44b5ab134efb/ut23007_22.jpg"),
    price: 1490,
    colors: [
      "Білий",
      "Чорний",
      "Червоний",
      "Синій",
      "Сірий",
      "Яскраво-синій",
      "Бордо",
      "Натуральний",
      "Темно-синій",
    ],
    sizes: APPAREL_SIZES,
    material: "60 % перероблена бавовна, 39 % перероблений поліестер",
    gender: "unisex",
    categoryId: "clothing",
  },
  {
    key: "26432",
    name: "Пляшка з переробленої нержавіючої сталі, 400 мл",
    brand: null,
    image: cdn("b5/9b/b59b3f05-5e9e-4e26-8c3e-3c7442f82da2/26432_01.jpg"),
    price: 690,
    colors: [
      "Білий",
      "Чорний",
      "Червоний",
      "Зелений",
      "Синій",
      "Помаранчевий",
      "Сріблястий",
      "Яскраво-синій",
    ],
    sizes: [],
    tags: ["new"],
    categoryId: "drinkware",
  },
  {
    key: "07124",
    name: "Шопер Milano з бавовни 220 г/м², довгі ручки",
    brand: "Handle Bags",
    image: cdn("39/87/39875584-1651-4ea7-97dd-e7a3ec19f706/07124_01.jpg"),
    price: 190,
    colors: [
      "Білий",
      "Чорний",
      "Червоний",
      "Зелений",
      "Синій",
      "Жовтий",
      "Помаранчевий",
      "Сірий",
      "Яскраво-синій",
      "Рожевий",
      "Блакитний",
      "Коричневий",
      "Фуксія",
      "Фіолетовий",
      "Іржавий",
      "Смарагдовий",
      "Сливовий",
      "Яблучний",
      "Матча",
      "Петроль",
      "Світло-блакитний",
      "М’ятний",
      "Темно-зелений",
    ],
    sizes: [],
    material: "бавовна 220 г/м²",
    categoryId: "bags",
  },
  {
    key: "25501",
    name: "Парасоля-автомат з R-PET із ручкою-карабіном",
    brand: null,
    image: cdn("a2/af/a2afeffa-10c5-404a-a3d3-9b3f3b382f93/25501_01.jpg"),
    price: 590,
    compareAtPrice: 790,
    colors: ["Білий", "Чорний", "Червоний", "Синій", "Яскраво-синій"],
    sizes: [],
    categoryId: "home",
  },
  {
    key: "ut26001",
    name: "Футболка унісекс з органічної бавовни, 145 г/м²",
    brand: "Utopic",
    image: cdn("c1/d2/c1d22b0e-4316-4393-a7c0-fe81e6b82ecb/ut26001_02.jpg"),
    price: 490,
    colors: [
      "Чорний",
      "Червоний",
      "Синій",
      "Яскраво-синій",
      "Світло-блакитний",
      "Зелений",
    ],
    sizes: APPAREL_SIZES,
    material: "100 % органічна бавовна",
    gender: "unisex",
    categoryId: "clothing",
  },
  {
    key: "dm24113",
    name: "Рюкзак для ноутбука Ocean Roll з переробленого океанічного пластику",
    brand: "DEMI Design Milano",
    image: cdn("7e/35/7e3510eb-9fc4-46a0-94ea-4433187d9c37/dm24113_02.jpg"),
    price: 2490,
    compareAtPrice: 2990,
    colors: ["Чорний", "Синій"],
    sizes: [],
    material: "R-PET, сертифікат OceanCycle",
    categoryId: "bags",
  },
  {
    key: "26735",
    name: "Щоденник 2027 Lynx compact, тверда ламінована обкладинка",
    brand: null,
    image: cdn("b3/12/b312cbc3-c782-4861-8b88-0d79392cece2/26735_01.jpg"),
    price: 290,
    colors: [
      "Білий",
      "Чорний",
      "Червоний",
      "Зелений",
      "Синій",
      "Помаранчевий",
      "Яскраво-синій",
    ],
    sizes: [],
    tags: ["new"],
    categoryId: "office",
  },
];

export const homeProducts: CrmProduct[] = PRODUCT_SEEDS.flatMap(expand);


/** Тип виводимо з даних: літеральні адреси мають дожити до <Link> для typedRoutes. */
export type HomeCategory = (typeof homeCategories)[number];

/** Категорії сайту — згруповане дерево Sipec (див. docs/PAGES.md → мапінг категорій). */
export const homeCategories = [
  {
    slug: "bags",
    name: "Сумки та рюкзаки",
    href: "/catalog/bags",
    image: cdn("05/f8/05f86c3c-4827-4852-8e9a-8287499271aa/dm20101_08.jpg"),
    note: "Шопери, рюкзаки, для ноутбука",
    tint: "lime",
  },
  {
    slug: "drinkware",
    name: "Пляшки та кухлі",
    href: "/catalog/drinkware",
    image: cdn("fe/28/fe285ea4-7a1c-472d-bf64-e6bcc4f4e715/12406s_44.jpg"),
    note: "Пляшки, термоси, чашки",
    tint: "sky",
  },
  {
    slug: "clothing",
    name: "Одяг",
    href: "/catalog/clothing",
    image: cdn("1f/40/1f407778-7728-4494-a4e4-2d82e9af226a/00078_10.jpg"),
    note: "Футболки, худі, поло, жилети",
    tint: "tomato",
  },
  {
    slug: "hats",
    name: "Кепки та аксесуари",
    href: "/catalog/hats",
    image: cdn("ad/dd/addd47d2-1c7c-493f-a5cd-bf1861649213/00129_10.jpg"),
    note: "Кепки, шапки, шарфи, банданы",
    tint: "mint",
  },
  {
    slug: "office",
    name: "Офіс і канцелярія",
    href: "/catalog/office",
    image: cdn("db/0d/db0d6593-87f3-4c43-bbfa-2b73641e608a/00638_10.jpg"),
    note: "Ручки, блокноти, щоденники",
    tint: "sand",
  },
  {
    slug: "tech",
    name: "Техніка",
    href: "/catalog/tech",
    image: cdn("e3/6b/e36b42e6-ab2f-41cd-8788-9e8c159adbd7/21444_22.jpg"),
    note: "Powerbank, USB, навушники",
    tint: "sky",
  },
  {
    slug: "home",
    name: "Дім і кухня",
    href: "/catalog/home",
    image: cdn("ab/f3/abf37dfc-24dc-4201-8277-2ac7a092bb6d/00018_09.jpg"),
    note: "Фартухи, рушники, парасолі",
    tint: "lime",
  },
  {
    slug: "travel",
    name: "Подорожі та спорт",
    href: "/catalog/travel",
    image: cdn("8e/66/8e665ed9-c963-40d2-8069-8be020ccfaad/dm20108_05.jpg"),
    note: "Несесери, косметички, аксесуари",
    tint: "tomato",
  },
] as const;

export type HomeBrand = (typeof homeBrands)[number];

/** Три бренди каталогу; lifestyle-банери — з сайту постачальника. */
export const homeBrands = [
  {
    slug: "handle-bags",
    name: "Handle Bags",
    tagline: "326 моделей",
    text: "Шопери та сумки з сертифікованої бавовни, джуту, паперу й переробленого PET. Від класичного Milano до подарункових мішечків.",
    href: "/catalog?q=Handle",
    image: cdn("d3/91/d391f5e3-32f0-469e-b654-c3bcb4663422/handle_brand_homepage_new.jpg"),
  },
  {
    slug: "demi-design-milano",
    name: "DEMI Design Milano",
    tagline: "65 моделей",
    text: "Рюкзаки, сумки для ноутбука, несесери й дорожні аксесуари. Колекції Brera, R-Live, Canvas 4.0 та OceanCycle з переробленого океанічного пластику.",
    href: "/catalog?q=DEMI",
    image: cdn("1e/8d/1e8df668-220e-494c-b9c4-a1003dcaef39/demi_brand_homepage.jpg"),
  },
  {
    slug: "utopic",
    name: "Utopic",
    tagline: "Базовий одяг",
    text: "Футболки, худі, поло, жилети та софтшели з органічної та переробленої бавовни. Сертифікована переробка GRS.",
    href: "/catalog?q=Utopic",
    image: cdn("fb/fb/fbfb5b32-e614-456a-9c3a-cff5b4091aa8/utopic_brand_homepage.jpg"),
  },
] as const;

export type HeroTile = (typeof heroShowcase)[number];

/** Вітрина в hero: по одному packshot на ключовий напрям асортименту. */
export const heroShowcase = [
  {
    label: "Рюкзаки",
    note: "158 моделей",
    href: "/catalog/bags",
    image: cdn("7e/35/7e3510eb-9fc4-46a0-94ea-4433187d9c37/dm24113_02.jpg"),
    alt: "Рюкзак для ноутбука з переробленого пластику",
    tint: "lime",
  },
  {
    label: "Пляшки та кухлі",
    note: "81 модель",
    href: "/catalog/drinkware",
    image: cdn("b5/9b/b59b3f05-5e9e-4e26-8c3e-3c7442f82da2/26432_01.jpg"),
    alt: "Пляшка з нержавіючої сталі, 400 мл",
    tint: "sky",
  },
  {
    label: "Одяг",
    note: "71 модель",
    href: "/catalog/clothing",
    image: cdn("c1/d2/c1d22b0e-4316-4393-a7c0-fe81e6b82ecb/ut26001_02.jpg"),
    alt: "Футболка унісекс з органічної бавовни",
    tint: "tomato",
  },
  {
    label: "Шопери",
    note: "228 моделей",
    href: "/catalog/bags",
    image: cdn("39/87/39875584-1651-4ea7-97dd-e7a3ec19f706/07124_01.jpg"),
    alt: "Бавовняний шопер з довгими ручками",
    tint: "mint",
  },
] as const;

/** Фото промо-блоків. */
export const homeImages = {
  promoSale: cdn("25/28/25280e33-2de3-4267-82e0-0ad0edca9afc/dm20105_64.jpg"),
  promoBusiness: cdn("db/0d/db0d6593-87f3-4c43-bbfa-2b73641e608a/00638_10.jpg"),
};
