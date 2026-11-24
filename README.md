# KA7LA Store

Storefront for KA7LA streetwear (Tunisia). React, TypeScript and Vite on the front end, Supabase for the catalog, orders, discounts and support, and a Supabase Edge Function for order processing.

## Store

- **Catalog** — products, categories, prices, images and stock come from Supabase. Collection filters, sorting and search run against the live catalog.
- **Stock** — every successful order reserves its items with a conditional, concurrency-safe decrement of `products.stock`. `NULL` stock means unlimited. If an item cannot be reserved, the order is removed and checkout returns a sold-out message before any notification is sent.
- **Checkout** — customer and delivery details are stored with each order. Payment is cash on delivery. Card payment is not offered.
- **Discounts** — codes are validated against the `discounts` table at checkout and rejected when inactive or misconfigured. Multi-buy quantity discounts are applied per product.
- **Support** — customer messages go into a Supabase-backed support inbox with ticket status, customer replies and admin responses.
- **Admin** — `/signin` and `/admin` manage products, stock, categories, discounts, order statuses, support tickets and store settings. New orders and support tickets arrive in real time through Supabase Realtime. Product photos can be uploaded to the `store-images` Supabase Storage bucket (JPG, PNG, WEBP or AVIF, up to 8 MB).

Row-level security restricts admin writes to the configured admin email; storefront catalog reads are public. The admin account must exist in Supabase Auth and be email-confirmed if the project requires confirmation. Account creation is not offered in the app.

## Configuration

Browser variables (`.env.local`, based on `.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon/publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY` is also accepted) |
| `VITE_SITE_URL` | Public site origin, used for absolute social-preview image URLs |

Never put a service-role key or other secret in the browser app. `src/supabaseConfig.ts` contains browser-safe project defaults so production builds connect even when `.env.local` is not present.

`create-order` Edge Function secrets (set with `supabase secrets set`):

| Secret | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for new-order messages |
| `TELEGRAM_CHAT_ID` | Telegram chat that receives new-order messages |
| `RESEND_API_KEY` | Resend API key for new-order emails |
| `ORDER_EMAIL_FROM` | Verified sender, e.g. `KA7LA Store <orders@your-domain.tn>` |
| `ADMIN_ORDER_EMAIL` | Optional recipient override (defaults to `siihmzzz@gmail.com`) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to Edge Functions. Telegram and email notifications are best effort: a provider failure is logged but does not cancel a saved order. The order ID is used as the email idempotency key.

## Run locally

```sh
npm install
cp .env.example .env.local   # fill in the values for your project
npm run dev
```

Create a production build with `npm run build` and serve it with `npm run preview`.

## Deploy

1. Apply the SQL files in `supabase/migrations/` to the Supabase project (`supabase db push` or the SQL editor). They create the catalog, orders, discounts, support tables, storage bucket, RLS policies and Realtime publications.
2. Create the admin user in Supabase Auth with the configured admin email and confirm it.
3. Set the Edge Function secrets listed above.
4. Deploy the function: `supabase functions deploy create-order`.
5. Set the browser variables in your hosting environment (for example Vercel) and deploy the site with `npm run build`.
