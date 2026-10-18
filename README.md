# Ka7la Store

A responsive fashion storefront built with React, TypeScript, Vite, and Lucide icons.

## Run locally

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set the project URL and public anon key before starting the app. Never put a service-role or secret key in this browser app.

Create a production build with `npm run build` and serve it with `npm run preview`.

## Store features

- Home, collection, product, search, wishlist, cart, account placeholder, and checkout routes with customer details and server-saved orders.
- Collection category and price filters, sorting, and product search.
- Product size and color selection, cart quantity controls, and size validation.
- Guest cart and wishlist persisted in browser local storage.
- Responsive navigation drawers, search dialog, and mobile category/filter layouts.
- A continuous horizontal marquee that loops independently of scrolling.
- Email/password admin sign-in at `/signin` and `/admin` for `Siihmzzz@gmail.com`.
- Admin controls for products and demo stock, categories, order statuses, discounts, and storefront settings, stored in the shared database. Product photos can be uploaded from the admin device.

Database row-level security restricts admin writes to the configured admin email. Storefront reads are public. The admin account must already exist in the authentication provider and be email-confirmed if the project requires confirmation. Account creation is intentionally unavailable in the app. Checkout saves customer contact, delivery, and item snapshot details through the `create-order` Edge Function; orders are visible to the admin in real time. Online payment is not configured, and discount codes are not applied at checkout. Inventory still uses fixture values.

Set `VITE_SITE_URL` to the deployed site origin so link previews use an absolute logo image URL. The supplied KA7LA logo is used for the browser icon, home-screen icon, and social preview. Image uploads are limited to JPG, PNG, WEBP, or AVIF files up to 8 MB. Products, images, and prices are development fixtures; the displayed TND currency is provisional and needs confirmation. Checkout creates a server-saved order with customer details; online payment is not configured. Newsletter delivery and legal/contact destinations need real store configuration before launch. Product photography is served from Unsplash URLs and can be replaced in `src/store.tsx`.

## Deploying on Vercel

The connected Supabase project URL and public anon key have browser-safe defaults in `src/supabaseConfig.ts`, so production builds connect even though `.env.local` is ignored by Git. You can override these with `VITE_SUPABASE_URL` and either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`. Set `VITE_SITE_URL` to the public site origin for absolute social-preview image URLs. Never put a service-role or secret key in the browser app.
