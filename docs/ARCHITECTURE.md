# Архітектура

## Стек

| Шар | Технологія | Навіщо |
| --- | --- | --- |
| Фреймворк | Next.js 16.3 (App Router) | серверні компоненти, streaming, Cache Components, Image/Font optimization |
| UI | React 19.2 + React Compiler | автоматична мемоізація, менше ручного `useMemo`/`useCallback` |
| Стилі | CSS Modules + CSS-змінні | нуль залежностей, вбудовано в Next, токени в одному місці |
| Мова | TypeScript 5 (strict) | типи контракту CRM, безпечний рефакторинг |
| Дані | Obriym CRM Public API (`/api/v1/*`) | каталог, замовлення, покупці, доставка — без власної БД |
| Хостинг | Vercel або Fly.io | Node.js runtime (Cache Components не працюють на edge) |

> ⚠️ Next.js 16 має суттєві зміни відносно 13–15. Перед написанням коду читати
> `node_modules/next/dist/docs/` (вимога `AGENTS.md`). Ключове: async
> `params`/`searchParams`, `cacheComponents` замість `experimental.ppr`,
> `proxy.ts` замість `middleware.ts`, Turbopack за замовчуванням, `next lint`
> видалено (ESLint запускається напряму), `images.domains` застаріло —
> тільки `remotePatterns`.

### Чому CSS Modules, а не Tailwind чи StyleX

- **Tailwind** — не встановлюємо: власник проєкту не погодив залежність.
- **StyleX** — Next 16 підтримує його, але лише через Babel-плагін
  (`@stylexjs/babel-plugin`). Наявність Babel-конфігу вимикає швидкий
  SWC-шлях для всього проєкту (повільніші dev і build), а офіційного
  Turbopack-плагіна для StyleX немає. Користь StyleX (типізована композиція
  стилів, атомарний CSS) відчутна у великих багатокомандних кодових базах;
  для вітрини з одним розробником вона не переважує ускладнення збірки.
  Рішення можна переглянути, якщо кодова база виросте — але міграція стилів
  тоді буде коштувати, тому вирішувати краще зараз.
- **CSS Modules** уже працюють «з коробки»: локальна область класів, токени
  через CSS-змінні в `globals.css`, жодних runtime-витрат.

## Принципи

1. **CRM — джерело істини, сайт — без бази.** Жодних таблиць товарів чи
   замовлень на боці сайту. Кошик — у браузері (localStorage/cookie) до моменту
   checkout, після чого замовлення живе в CRM.
2. **Bearer token ніколи не потрапляє в браузер.** Усі виклики CRM — із
   Server Components, Server Actions або Route Handlers. Клієнтські компоненти
   отримують уже готові view-моделі.
3. **Server-first.** Сторінки — серверні компоненти; клієнтські (`"use client"`)
   лише там, де потрібна інтерактивність: кошик, вибір розміру, відлік, меню.
4. **View-моделі замість сирих відповідей CRM.** Компоненти не знають про поля
   CRM. Між API та UI — тонкий шар `src/lib/catalog/*` (наприклад,
   `toProductCards`, який групує рядки-розміри в одну картку).
5. **Живий каталог із CRM.** Головна читає товари складу ITALINO та дерево
   категорій CRM. Навігація, бренди, сторінки категорій, sitemap і товарні
   зображення головної будуються лише з категорій та брендів, реально використаних
   видимими товарами цього складу; помилки CRM не підміняються мок-даними.
6. **Нові залежності — лише з погодженням.**

## Структура коду

```
src/
  app/
    layout.tsx           root layout: шрифти, metadata, announcement bar, header, footer
    page.tsx             головна сторінка
    globals.css          токени (:root), reset, глобальні класи (.wrap, .btn, .eyebrow, .section-title)
    icon.svg             favicon (Next metadata file convention)
    (далі) catalog/[category]/page.tsx, product/[slug]/page.tsx, cart/, checkout/, track/, delivery/ ...
  components/
    layout/              announcement-bar, site-header, site-footer (кожен зі своїм .module.css)
    home/                hero, city-marquee, how-it-works, category-tiles, product-rail,
                         dispatch-banner (+ dispatch-clock — клієнтський), promo-split, why-italino, newsletter
    catalog/             product-card
    ui/                  icons.tsx (інлайн-SVG, без бібліотеки іконок)
  lib/
    crm/types.ts         типи публічного API CRM (звужені до потрібних полів)
    crm/client.ts        server-only fetch: base URL, Bearer, timeout, помилки
    crm/catalog.ts       товари складу ITALINO, точкові SKU/group-запити, remote cache
    catalog/             view-моделі: catalog-index.ts, product-cards.ts, categories.ts, brands.ts
    shipping/schedule.ts розклад поставок, nextCutoff/nextDispatch, форматування дат
    format.ts            formatPrice (UAH, uk-UA)
docs/                    документація
```

Іменування файлів — `kebab-case.tsx`; компоненти експортуються іменовано
(`export function SiteHeader`), сторінки — `export default`. Стилі компонента —
поруч, `component-name.module.css`. Глобальні класи (`.wrap`, `.btn*`,
`.eyebrow`, `.section-title`, `.section-head`) — тільки в `globals.css`.

## Рендеринг і кешування

У `next.config.ts` увімкнено `cacheComponents: true`. Це означає:

- Кожна сторінка має **статичну оболонку** (prerender) + динамічні частини, що
  стрімляться в `<Suspense>`.
- Дані з CRM кешуються явно директивами `"use cache"` / `"use cache: remote"`
  та `cacheLife(...)`. Remote-кеш потрібен каталогу, щоб один компактний індекс
  використовували всі serverless-інстанси:

| Дані | Кеш | Інвалідація |
| --- | --- | --- |
| Категорії | `"use cache: remote"`, профіль `minutes` | `revalidateTag("catalog")` через webhook від CRM |
| Індекс каталогу (один запис на модель) | `"use cache: remote"`, revalidate 5 хв | теги `catalog`, `products`; `updatedAt` для sitemap |
| Варіанти однієї моделі / SKU кошика | точкові CRM-запити, remote cache `minutes` | теги `catalog`, `products` |
| Ціна й залишок SKU на checkout | точковий запит без кешу | — |
| Статус замовлення (`/track`) | без кешу | — |
| Розклад поставок | константа; дата рендериться на клієнті | — |

- Усе, що читає `cookies()`/`headers()`/`searchParams` (кошик, фільтри
  каталогу), — у `<Suspense>` або через `"use cache: private"`.
- Поточний час (`Date.now()`) не використовується в серверному рендері:
  зворотний відлік і дата наступної відправки рендеряться на клієнті через
  `useSyncExternalStore` із серверним fallback-текстом («у неділю») —
  як і всі тексти про графік, його дає `SCHEDULE_COPY`.

Ліміти CRM (120 req/хв на list-endpoint-и, 60 на write) — ще одна причина
кешувати каталог і не робити запит на кожного відвідувача.

CRM зберігає один рядок на варіант «колір × розмір», тому повний склад може
мати тисячі рядків. `catalog-index.ts` під час оновлення проходить усі сторінки
CRM обмеженими паралельними пачками й одразу згортає їх за `productGroupId`.
У remote cache потрапляє компактний індекс моделей, а не повні CRM-відповіді.
Сторінка товару читає лише свій `productGroupId`; кошик і checkout — лише свої SKU.

## Зображення

- Фото товарів приходять із CRM як абсолютні URL (`images[].url`). Домен(и)
  додаються в `images.remotePatterns` у `next.config.ts`.
- Дозволені CDN Sipec `media.on-gadget.com` і шлях фото товарів поточного
  workspace у Vercel Blob. Для іншого сховища додати точний домен/шлях.
- Пропорції: картка товару 3:4, hero 4:5, плитки категорій — cover.

## Змінні середовища

| Змінна | Де | Призначення |
| --- | --- | --- |
| `OBRIYM_API_URL` | сервер | Базовий URL інстансу CRM, без `/api/v1` |
| `OBRIYM_API_TOKEN` | сервер | Scoped Bearer token `obr_...` (див. CRM_INTEGRATION.md → Scopes) |
| `OBRIYM_WAREHOUSE_ID` | сервер | Обов’язковий ID складу ITALINO; обмежує товари вітрини |
| `NEXT_PUBLIC_SITE_URL` | клієнт+сервер | Канонічний URL сайту для metadata, OG, sitemap |
| `CRM_WEBHOOK_SECRET` | сервер | (план) підпис webhook-ів CRM для `revalidateTag` |

Шаблон — `.env.example`. Реальні значення — тільки в `.env.local` (в `.gitignore`).

## Аналітика: Microsoft Clarity і Google Analytics

- Пакети `@microsoft/clarity` (дозвіл власника 2026-09-21) та `@next/third-parties`
  (власник установив сам). ID — у `src/lib/analytics.ts`: Clarity `ylx61ogtjw`,
  GA4 `G-5PRGP4ZY51`.
- Обидва підключає один компонент `<Analytics>` у кореневому layout і вмикає
  **лише на домені з `SITE_URL`** (порівняння хоста в браузері): localhost,
  локальний `next start` і preview-деплої у звіти не потрапляють.
- Згода Google за замовчуванням (`consent-defaults.ts`, скрипт
  `beforeInteractive` — раніше за `gtag('config')`): рекламне сховище вимкнено
  скрізь, аналітичні cookie — для ЄЕЗ, Британії й Швейцарії. Clarity для цих
  країн без сигналу згоди поводиться так само сама. Банера згоди немає.
- Події — тільки через `trackEvent()`: вона шле і в Clarity, і в GA, але лише
  якщо інструмент справді підключено (`Clarity.event()` без скрипта падає,
  `sendGAEvent()` пише попередження). Зараз: `add_to_cart` (з товаром і ціною,
  рекомендована подія GA4), `checkout_submit`, `order_created` (із сумою).
- Форма оформлення й картка статусу замовлення мають `data-clarity-mask="True"`.
  Нова форма з персональними даними — теж під маску.
- Використання обох інструментів розкрито в політиці конфіденційності з
  посиланнями, яких вимагають умови Clarity та розділ 7 умов Google Analytics.

## Якість

Перед комітом: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
Тести додаються разом із першою бізнес-логікою (групування варіантів, розклад
поставок, кошик); тест-раннер — на погодження.

## Рішення та їх причини

- **Без UI-бібліотеки** на старті — магазину потрібен впізнаваний власний
  вигляд; примітиви для діалогів/селектів додамо точково, з погодженням.
- **Гостьовий checkout у першому релізі** — менше тертя; кабінет — після.
- **Кошик у браузері, не в CRM** — CRM не має cart API; кошик стає замовленням
  лише в момент checkout (`POST /api/v1/orders` з `externalId` = id замовлення
  сайту → ідемпотентність).
