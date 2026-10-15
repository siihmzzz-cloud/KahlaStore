# Ka7la Store

A responsive fashion storefront prototype built with React, TypeScript, Vite, GSAP ScrollTrigger, and Lucide icons.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build` and serve it with `npm run preview`.

## Working in this prototype

- Home, collection, product, search, wishlist, cart, account placeholder, and checkout preview routes.
- Collection category and price filters, sorting, and product search.
- Product size and color selection, cart quantity controls, and size validation.
- Guest cart and wishlist persisted in browser local storage.
- Responsive navigation drawers, search dialog, and mobile category/filter layouts.
- A continuous, seamless GSAP editorial ticker that loops independently of scrolling.
- Local admin preview at `/signin` and `/admin` for the allowlisted email `Siihmzzz@gmail.com`.
- Admin controls for product fields and stock fixtures, categories, demo order statuses, discount-code drafts, and storefront settings.

The admin preview is not secure authentication: the email allowlist and admin session are stored in the browser and can be bypassed. Admin changes use browser local storage on the current device and are not shared with a server. Orders are local demo references, discounts are not applied at checkout, and stock is only a fixture. Do not use this preview to manage a live store. Add server-side authentication, database-backed catalog/order management, payment, shipping, and policy configuration before launch.

Products, images, and prices are development fixtures; the displayed TND currency is provisional and needs confirmation. Checkout produces only a local demo reference; it does not create an order or collect payment. Newsletter delivery and legal/contact destinations need real store configuration before launch. Product photography is served from Unsplash URLs and can be replaced in `src/store.tsx`.
