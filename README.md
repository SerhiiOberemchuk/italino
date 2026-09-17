# Italino — товари на щодень з доставкою в Україну

Сумки й рюкзаки, пляшки та термокухлі, базовий одяг, канцелярія, техніка й
подарунки з каталогу італійського постачальника **Sipec** (Мілан) та його
брендів Handle Bags, DEMI Design Milano й Utopic. Клієнти замовляють у каталозі
онлайн, а всі замовлення тижня їдуть зі складу в Мілані в Україну **однією
поставкою — раз на тиждень, щонеділі**.

> Постачальник італійський, виробництво — ні. Сайт ніде не заявляє
> «Made in Italy»: [правило комунікації](docs/ASSORTMENT.md#️-країна-виробництва--правило-комунікації).

Бекофіс магазину (каталог, ціни, залишки, замовлення, покупці, доставка) —
**Obriym CRM**. Сайт не має власної бази даних: усе читається й пишеться через
публічний REST API CRM (`/api/v1/*`) із серверного коду Next.js.

## Статус проєкту

| Етап | Стан |
| --- | --- |
| Документація (`docs/`) | ✅ готово |
| Дизайн головної сторінки | 🟡 на погодженні — див. [docs/DESIGN.md](docs/DESIGN.md) |
| Решта сторінок (каталог, товар, кошик, checkout, відстеження) | ⏳ після погодження дизайну |
| Підключення до Obriym CRM (живі дані замість мок-даних) | ⏳ після погодження дизайну |

## Стек

- **Next.js 16.3** (App Router, Cache Components, React Compiler, Turbopack)
- **React 19.2**, **TypeScript 5** (strict)
- **CSS Modules + CSS-змінні** як дизайн-токени (`src/app/globals.css`), без додаткових залежностей
- Шрифти через `next/font/google`: **Playfair Display** (заголовки) + **Onest** (текст та інтерфейс), обидва з повною українською кирилицею
- Дані: публічний API **Obriym CRM** (server-to-server, Bearer token)

Залежності не додаються без погодження з власником проєкту.

## Запуск

```bash
npm install
cp .env.example .env.local   # заповнити OBRIYM_API_URL / OBRIYM_API_TOKEN, коли буде токен
npm run dev                  # http://localhost:3000
```

Поки CRM не підключено, головна сторінка рендериться з мок-даних
(`src/lib/mock/home.ts`), які мають ту саму форму, що й відповіді API CRM.

## Скрипти

| Команда | Що робить |
| --- | --- |
| `npm run dev` | dev-сервер із Turbopack |
| `npm run build` | production-збірка (перевіряє типи, Cache Components, метадані) |
| `npm run start` | запуск production-збірки |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npx tsc --noEmit` | перевірка типів |

## Документація

| Файл | Про що |
| --- | --- |
| [docs/PROJECT.md](docs/PROJECT.md) | Концепція, аудиторія, бізнес-модель, принципи, відкриті питання |
| [docs/ASSORTMENT.md](docs/ASSORTMENT.md) | Асортимент Sipec, дерево категорій, мапінг у категорії сайту, модель «модель → артикули», фото, ціни |
| [docs/DELIVERY.md](docs/DELIVERY.md) | Тижневий цикл доставки Італія → Україна, статуси, відображення на сайті |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Технічна архітектура, структура коду, рендеринг і кешування, env |
| [docs/CRM_INTEGRATION.md](docs/CRM_INTEGRATION.md) | Контракт із Obriym CRM: endpoint-и, scopes, мапінг даних, замовлення |
| [docs/DESIGN.md](docs/DESIGN.md) | Дизайн-система та специфікація головної сторінки (на погодження) |
| [docs/PAGES.md](docs/PAGES.md) | Карта сторінок, блоки кожної сторінки, порядок реалізації |

## Структура

```
src/
  app/                 маршрути App Router (layout, page, globals.css, icon.svg)
  components/
    layout/            announcement-bar, site-header, site-footer
    home/              секції головної сторінки
    catalog/           product-card
    ui/                іконки
  lib/
    crm/               типи публічного API Obriym CRM
    catalog/           view-моделі (групування артикулів у картку товару, кольори-зразки)
    shipping/          розклад тижневих поставок і зворотний відлік
    mock/              мок-дані до підключення CRM
    format.ts          форматування цін
docs/                  документація проєкту
```
