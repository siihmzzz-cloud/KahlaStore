# Ka7la Store

A responsive fashion storefront prototype built with React, TypeScript, Vite, GSAP ScrollTrigger, and Lucide icons.

## Run locally

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set the project URL and public anon key before starting the app. Never put a service-role or secret key in this browser app.

Create a production build with `npm run build` and serve it with `npm run preview`.

## Working in this prototype

- Home, collection, product, search, wishlist, cart, account placeholder, and checkout routes with customer details and server-saved orders.
- Collection category and price filters, sorting, and product search.
- Product size and color selection, cart quantity controls, and size validation.
- Guest cart and wishlist persisted in browser local storage.
- Responsive navigation drawers, search dialog, and mobile category/filter layouts.
- A continuous, seamless GSAP editorial ticker that loops independently of scrolling.
- Email/password admin sign-in at `/signin` and `/admin` for `Siihmzzz@gmail.com`.
- Admin controls for products and demo stock, categories, order statuses, discounts, and storefront settings, stored in the shared database. Product photos can be uploaded from the admin device.

Database row-level security restricts admin writes to the configured admin email. Storefront reads are public. The admin account must already exist in the authentication provider and be email-confirmed if the project requires confirmation. Account creation is intentionally unavailable in the app. Checkout saves customer contact, delivery, and item snapshot details through a server-side order function; orders are visible to the admin in real time. Online payment is not configured, and discount codes are not applied at checkout. Inventory still uses fixture values.

Set `VITE_SITE_URL` to the deployed site origin so link previews use an absolute logo image URL. The supplied KA7LA logo is used for the browser icon, home-screen icon, and social preview. Image uploads are limited to JPG, PNG, WEBP, or AVIF files up to 8 MB. Products, images, and prices are development fixtures; the displayed TND currency is provisional and needs confirmation. Checkout creates a server-saved order with customer details; online payment is not configured. Newsletter delivery and legal/contact destinations need real store configuration before launch. Product photography is served from Unsplash URLs and can be replaced in `src/store.tsx`.

## Deploying on Vercel

The `.env.local` file is intentionally ignored by Git and is not uploaded with the project. In Vercel, open **Project → Settings → Environment Variables** and add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SITE_URL` for the Production environment, then redeploy. Use the project URL and public anon key from the local `.env.local`; `VITE_SITE_URL` should be the public site origin. Without the first two variables, the storefront loads with sample products, while admin sign-in and shared data are unavailable.
