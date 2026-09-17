@AGENTS.md

# Italino — інтернет-магазин італійського одягу (Next.js 16 + Obriym CRM)

- Документація: `README.md` і `docs/` (PROJECT, ASSORTMENT, DELIVERY, ARCHITECTURE, CRM_INTEGRATION, DESIGN, PAGES). Перед зміною UI читати `docs/DESIGN.md`, перед роботою з даними — `docs/CRM_INTEGRATION.md`, перед роботою з каталогом — `docs/ASSORTMENT.md`.
- Асортимент — каталог італійського постачальника Sipec (промо-товари: сумки, пляшки, одяг, канцелярія, техніка). Товар = артикул «колір × розмір»; модель групує артикули через `productGroupId`. Фото — packshot на білому тлі з `media.on-gadget.com`.
- **Постачальник італійський, виробництво — ні (Азія).** Заборонено «Made in Italy», «італійські речі/одяг/якість». Можна: «каталог італійського постачальника», «зі складу в Мілані», факти про матеріали й сертифікати.
- Сайт має **лише світлу тему**: `color-scheme: light only` у CSS і `viewport.colorScheme = "light"` у layout. Не додавати `prefers-color-scheme` правил.
- Мова інтерфейсу, коментарів і документації — українська.
- **Жодних нових npm-залежностей без явного дозволу власника проєкту.** Стилі — CSS Modules + токени в `src/app/globals.css`; іконки — інлайн-SVG.
- Дані каталогу/замовлень — лише через публічний API Obriym CRM (`/api/v1/*`) із серверного коду; Bearer token ніколи не потрапляє в браузер.
- Перед завершенням: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
