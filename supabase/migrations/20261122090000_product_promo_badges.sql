alter table public.products
  add column if not exists compare_at_price numeric(12,2),
  add column if not exists promo_active boolean not null default false;

alter table public.products
  add constraint products_compare_at_price_nonnegative
  check (compare_at_price is null or compare_at_price >= 0);
