create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  type text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  stock integer check (stock is null or stock >= 0),
  image text not null default '',
  image2 text not null default '',
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  featured boolean not null default false,
  newest boolean not null default false,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  name text primary key,
  sort_order integer not null default 0
);

create table if not exists public.store_settings (
  id text primary key default 'default' check (id = 'default'),
  brand_name text not null default 'KA7LA',
  announcement text not null default 'NEW SEASON. NEW ENERGY. DISCOVER THE LATEST DROP.',
  currency text not null default 'TND',
  support_email text not null default '',
  shipping_note text not null default 'Shipping is not configured.',
  returns_note text not null default 'Returns policy is not configured.',
  updated_at timestamptz not null default now()
);

create table if not exists public.discounts (
  id text primary key,
  code text not null unique,
  amount integer not null check (amount between 1 and 90),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  total numeric(12,2) not null default 0 check (total >= 0),
  items jsonb not null default '[]'::jsonb,
  status text not null default 'New' check (status in ('New','Processing','Shipped','Complete','Cancelled'))
);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.store_settings enable row level security;
alter table public.discounts enable row level security;
alter table public.orders enable row level security;

grant select on public.products, public.categories, public.store_settings to anon, authenticated;
grant insert, update, delete on public.products, public.categories, public.store_settings, public.discounts, public.orders to authenticated;
grant select on public.discounts, public.orders to authenticated;

create policy "products_public_read" on public.products for select to anon, authenticated using (true);
create policy "products_admin_insert" on public.products for insert to authenticated with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "products_admin_update" on public.products for update to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com') with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "products_admin_delete" on public.products for delete to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

create policy "categories_public_read" on public.categories for select to anon, authenticated using (true);
create policy "categories_admin_insert" on public.categories for insert to authenticated with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "categories_admin_update" on public.categories for update to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com') with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "categories_admin_delete" on public.categories for delete to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

create policy "settings_public_read" on public.store_settings for select to anon, authenticated using (true);
create policy "settings_admin_insert" on public.store_settings for insert to authenticated with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "settings_admin_update" on public.store_settings for update to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com') with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

create policy "discounts_admin_read" on public.discounts for select to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "discounts_admin_insert" on public.discounts for insert to authenticated with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "discounts_admin_update" on public.discounts for update to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com') with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "discounts_admin_delete" on public.discounts for delete to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

create policy "orders_admin_read" on public.orders for select to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "orders_admin_insert" on public.orders for insert to authenticated with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "orders_admin_update" on public.orders for update to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com') with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "orders_admin_delete" on public.orders for delete to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

insert into public.categories (name, sort_order) values ('Men',1),('Women',2),('Kids',3)
on conflict (name) do nothing;
insert into public.store_settings (id) values ('default')
on conflict (id) do nothing;
