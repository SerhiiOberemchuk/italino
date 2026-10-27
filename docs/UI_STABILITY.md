# Interface regression checks

The shipping pickers, mobile drawer, quantity field and checkout fields use HeroUI components with the existing Italino CSS tokens. CRM remains the source of shipping directory IDs, prices and sellable quantities.

## Local checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build -- --webpack
```

TypeScript is restricted to 6.0.x because the installed TypeScript ESLint parser does not support TypeScript 7. ESLint 10 remains installed. npm can warn about the older peer ranges declared by Next's lint plugins; the lint check itself passes. The lockfile includes the peer dependencies required by a normal `npm ci`.

## Covered contracts

- Loading and obsolete shipping responses cannot supply an old city or warehouse selection.
- Editing a selected city immediately clears its warehouse, including while another search is loading.
- The mobile drawer contains keyboard focus and restores it to its trigger after Escape.
- Quantity stays within 1 and the current stock limit; removing a product remains a separate action.
- Server validation errors belong to individual fields. Contacts survive an unsuccessful Server Action.
- Checkout still submits the original field names, consent value, shipping reference IDs and cart snapshot.
- Retrying an unchanged cart reuses its attempt ID. A duplicate CRM response recovers the existing order/payment link.
- Current CRM price or sellable-stock changes refresh the cart before an order can be created.

The tests use a DOM environment and mocked CRM responses. They do not create live orders or perform payments. Browser rendering, physical touch interaction and live-provider checkout are separate verification steps.
