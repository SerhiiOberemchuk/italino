# Інтеграція з Obriym CRM

Сайт — **headless storefront** над публічним API Obriym CRM. Повний контракт —
в самій CRM: OpenAPI 3.1 за `GET /api/v1/openapi.json` та інтерактивна
документація за `/api-docs`. Тут — лише те, що використовує сайт, і як дані CRM
перетворюються на вітрину.

```text
Sipec (постачальник)  ──адаптер CRM──►  Obriym CRM  ──/api/v1/*──►  Сайт Italino
  каталог, ціна дилера,                 каталог, курс,               вітрина,
  склад у Мілані                        націнка, переклад            кошик, checkout
```

Сайт **ніколи не звертається до API Sipec**. Асортимент і його структура —
в [ASSORTMENT.md](ASSORTMENT.md).

## Автентифікація

- Усі запити — `Authorization: Bearer obr_...` з **серверного** коду сайту.
  Браузер покупця ніколи не викликає CRM напряму (правило CRM: «Customer
  browser не викликає CRM API напряму»).
- Token видається власником workspace у CRM: Settings → Integrations → API
  token з потрібними scopes. Показується один раз; у CRM зберігається лише хеш.
- Один token = один workspace + один `integrationSourceId` (джерело «сайт
  Italino»). Усі покупці й замовлення сайту будуть привʼязані до цього джерела.

### Scopes для сайту

| Scope | Навіщо |
| --- | --- |
| `products:read` | каталог, категорії, бренди, добірки, склади |
| `inventory:read` | перевірка залишку перед checkout (опційно; список товарів уже містить `stock`/`availability`) |
| `orders:read` | статус замовлення на `/track`, історія в кабінеті, `/capabilities` |
| `orders:write` | створення замовлення на checkout |
| `customers:read`, `customers:write` | кабінет покупця (другий етап) |
| `shipments:read` | ТТН і трекінг Нової Пошти |
| `payments:read`, `payments:write` | посилання на онлайн-оплату (якщо оплата через CRM-адаптер) |

## Endpoint-и, які використовує сайт

| Метод і шлях | Scope | Де на сайті |
| --- | --- | --- |
| `GET /api/v1/products` | `products:read` | каталог, категорія, пошук, головна (новинки, sale) |
| `GET /api/v1/products/{id}` | `products:read` | сторінка товару |
| `GET /api/v1/products/sku/{sku}` | `products:read` | перевірка позиції кошика |
| `GET /api/v1/categories` | `products:read` | навігація, сторінки категорій |
| `GET /api/v1/brands` | `products:read` | фільтр «Бренд», сторінка бренду |
| `GET /api/v1/collections` | `products:read` | блоки-добірки на головній |
| `GET /api/v1/collections/{slug}` | `products:read` | сторінка добірки |
| `GET /api/v1/capabilities` | `orders:read` | які способи оплати/доставки показувати на checkout |
| `GET /api/v1/carriers/nova_poshta/cities`, `.../warehouses` | `shipments:read` | вибір міста й відділення НП на checkout |
| `POST /api/v1/orders` | `orders:write` | checkout |
| `GET /api/v1/orders/{externalId}` | `orders:read` | «Де моє замовлення» |
| `GET /api/v1/orders/{externalId}/shipments` | `shipments:read` | ТТН і трекінг |
| `GET /api/v1/orders/{externalId}/payment-link` | `payments:read` | кнопка «Оплатити» після оформлення |
| `POST /api/v1/customers`, `GET/PATCH /customers/{externalId}` | `customers:*` | кабінет (етап 2) |

Формат помилок CRM: `{ error: { code, message, requestId, details? } }` з HTTP-статусом
(`400/401/403/404/409/413/422/429/500`). Сайт логує `requestId` і показує
покупцю нейтральне повідомлення.

Ліміти: list-endpoint-и — 120 req/хв, write — 60 req/хв на token+endpoint.
Тому каталог кешується (`"use cache"`), а не запитується на кожен перегляд.

## Модель каталогу в CRM і як вона стає вітриною

> Товари в CRM створює адаптер Sipec: кожен артикул «колір × розмір» — окремий
> рядок каталогу зі спільним `productGroupId` (код моделі). Саме цю модель
> читає вітрина.

### Товар (`GET /products` → `data[]`)

Поля відповіді, які читає сайт (повний перелік — в OpenAPI):

| Поле CRM | На сайті |
| --- | --- |
| `id`, `sku`, `name`, `description` | id, артикул, назва, опис |
| `status` (`active` тільки), `availability` (`in_stock` / `on_order` / `out_of_stock` / …) | показ у каталозі; бейдж «під замовлення» |
| `price`, `compareAtPrice`, `currency`, `prices[]` | ціна в UAH, стара ціна, % знижки |
| `images[].url`, `videos[].url` | галерея |
| `brand { id, name }` | бренд у картці, фільтр |
| `category { id, name, parentId }` | хлібні крихти, фільтр |
| `productGroupId`, `size`, `sizeSystem`, `color`, `material`, `gender`, `ageGroup` | **варіанти** — див. нижче |
| `stock` (null, якщо `trackInventory=false`) | «залишилось N» на сторінці товару |
| `tags[]` | бейдж `new`, добірки за тегом |
| `attributes[]`, `translations[]` | таблиця характеристик, локалізовані назви |
| `updatedAt` | `<lastmod>` у sitemap |

Запит підтримує фільтри `q`, `categoryId`, `brandId`, `collection`, `color`,
`inStock=true`, `minPrice`, `maxPrice`, пагінацію `page`/`perPage`
(відповідь: `{ data, pagination: { page, perPage, total } }`).

### Варіанти (колір і розмір) — головне правило

Каталог CRM **плоский**: один рядок = один артикул. Худі Utopic у 9 кольорах і
6 розмірах — це **54 рядки** зі спільним `productGroupId` (код моделі Sipec) і
різними `color` / `size`. Сайт групує рядки в одну картку:

```text
CRM rows (артикули Sipec)                  Storefront card
UT2300701S … UT2300701XXL  (білий)     ┐
UT2300702S … UT2300702XXL  (чорний)    ├─► «Худі унісекс 280 г/м²», 1 490 ₴,
…                                       │   9 кольорів · S M L XL XXL
UT2300709S … UT2300709XXL  (нічний)    ┘
```

Реалізація — `toProductCards()` у `src/lib/catalog/product-cards.ts`:
ключ групи = `productGroupId ?? id`; розміри сортуються (літерні за шкалою
XXS→4XL, числові за значенням); кольори — унікальні значення `color`; ціна
картки — мінімальна серед рядків; бейдж `sale`, якщо є `compareAtPrice` >
`price`, інакше `new`, якщо є тег `new`.

Адаптер Sipec заповнює це сам: `productGroupId` = код моделі, `color` і `size`
беруться з атрибутів артикула (`attributo_chiave`), а не з позицій цифр у коді.
Товари без розмірів (сумки, пляшки, ручки) мають `size: null` — картка показує
лише кольори.

Кольори на вітрині рендеряться кружечками; відтінок підбирає
`swatchColor()` (`src/lib/catalog/colors.ts`) за назвою кольору українською.
Це лише візуальний натяк — точний вигляд покупець бачить на фото.

### Категорії, бренди, добірки

- `GET /categories` → дерево через `parentId`; верхній рівень — пункти меню.
  Slug категорії (`slug`) — URL сторінки `/catalog/{slug}`.
- `GET /brands` → фільтр і сторінка бренду.
- `GET /collections` → **блоки на головній**: «Нові надходження», «Sale»,
  «Осінь 2026» тощо. Добірки мають обкладинку, порядок, сезонне вікно
  (`startsAt/endsAt`) — CRM віддає лише «живі». Команда керує вітриною з CRM без
  деплою. Товари добірки з фільтрами — `GET /products?collection={slug}`.

### Ціни та валюта

CRM **не конвертує валюти**. Sipec віддає ціну дилера в EUR без ПДВ; власник
задає в CRM курс (гривень за 1 €) і націнку у відсотках, і CRM рахує ціну
продажу в UAH. Сайт читає `prices[]` і бере запис для `UAH`; якщо його немає —
товар не показується (немає ціни для ринку).

### Наявність

`availability` відображає залишок на складі Sipec у Мілані (CRM оновлює щодня):
`in_stock` → «в наявності», `on_order` → «під замовлення» (є підтверджена дата
надходження), `out_of_stock` → «немає». Поле `stock` зазвичай `null`, бо
власного обліку залишків немає — вітрина має читати саме `availability`.

## Замовлення (checkout)

`POST /api/v1/orders` (scope `orders:write`), ідемпотентно за `externalId`:

```json
{
  "externalId": "site-2026-000123",
  "currency": "UAH",
  "items": [
    { "productName": "Худі унісекс 280 г/м², чорний, L", "sku": "UT2300702L", "quantity": 1, "unitPrice": "1490.00", "discount": 0 }
  ],
  "customer": {
    "firstName": "Олена", "lastName": "Коваль",
    "email": "olena@example.com", "phone": "+380671234567",
    "shippingAddress": { "country": "UA", "city": "Київ", "line1": "Відділення №5", "postalCode": "01001" }
  },
  "delivery": {
    "carrier": "nova_poshta", "method": "branch", "branch": "Відділення №5, Київ",
    "phone": "+380671234567", "cod": true, "comment": "Дзвонити після 18:00"
  },
  "promoCode": "WELCOME10",
  "discountAmount": 349,
  "notes": "Поставка від 20.09.2026"
}
```

- `externalId` — номер замовлення сайту; повтор того самого payload повертає
  те саме замовлення (`importStatus: "existing"`), тож подвійний клік безпечний.
- `items[].sku` — SKU конкретного варіанта (розміру); CRM сама привʼязує
  `productId` за SKU.
- `delivery` — **побажання покупця** (перевізник, відділення, накладений
  платіж). Реальна ТТН створюється в CRM після прибуття поставки.
- `notes` — сайт записує дату поставки, у яку потрапило замовлення (див.
  DELIVERY.md).
- Перед показом способів оплати/доставки на checkout читаємо
  `GET /capabilities`: пропонуємо лише те, що підключено у workspace
  (`nova_poshta`, `pickup`, `cod`, `prepaid`, `liqpay`/`wayforpay` тощо).
- Вибір міста й відділення НП — через `GET /carriers/nova_poshta/cities?q=` і
  `.../warehouses?cityRef=` (працює, якщо у workspace підключено адаптер НП).

Відповідь: `{ data: { id, externalId, status, importStatus, deduplicated } }`.
Статус замовлення далі читається з `GET /orders/{externalId}` →
`{ status, totalAmount, currency, updatedAt }`; ТТН — з `/shipments`.

## Покупці (етап 2)

Кабінет належить сайту: реєстрація, вхід, сесія — на боці сайту. Після
реєстрації сайт синхронізує профіль у CRM: `POST /customers` з
`externalId` = id користувача сайту; замовлення зареєстрованого покупця
передаються з `customer.externalId`. Історія — `GET /orders?customerExternalId=`.

## Зображення з CRM

`images[].url` — абсолютні https-URL. Для товарів Sipec це хот-лінки на CDN
постачальника `media.on-gadget.com` (уже в `images.remotePatterns`). Якщо
команда завантажить власні фото у Vercel Blob, треба буде додати і той домен.

## Інвалідація кешу (план)

CRM має webhook-доставку (QStash). Цільова схема: CRM → `POST
{SITE}/api/revalidate` з підписом → `revalidateTag("catalog")`. До реалізації
webhook-а — `cacheLife("minutes")` для товарів і `("hours")` для довідників.

## Чекліст підключення

Серверне підключення реалізоване в `src/lib/crm/client.ts`, кеш товарів —
`src/lib/crm/catalog.ts`. Головна читає тільки склад **ITALINO** через
`warehouseId=OBRIYM_WAREHOUSE_ID`, з `status=active`,
`storefrontVisibility=visible` та `sort=newest`. Якщо склад не задано, запит
не виконується, щоб випадково не опублікувати весь каталог workspace.
Показуємо до 8 моделей із перших 100 артикулів; повна пагінація каталогу й
підвантаження всіх варіантів моделі належать до майбутньої сторінки каталогу.
Категорії та промо-блоки головної наразі залишаються статичними.

1. У CRM підключити адаптер Sipec (ключ дилера), обрати бренди й категорії,
   задати склад, курс і націнку, запустити імпорт і активувати чернетки.
2. Створити категорії Italino в CRM і призначити їх імпортованим товарам
   (мапінг — [ASSORTMENT.md](ASSORTMENT.md)).
3. Створити API token для джерела «Сайт Italino» зі scopes із таблиці.
4. Заповнити `.env.local`: `OBRIYM_API_URL`, `OBRIYM_API_TOKEN`, `OBRIYM_WAREHOUSE_ID`.
5. Перевірити реальні товари та ціни на головній. Токен не записувати в `.env.example`.
6. Перевірити на тестовому workspace: каталог → картка → checkout → замовлення
   в `/admin/orders` CRM.
