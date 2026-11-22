create table if not exists public.support_tickets (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) between 1 and 100),
  contact text not null check (length(trim(contact)) between 3 and 160),
  subject text not null check (length(trim(subject)) between 1 and 140),
  message text not null check (length(trim(message)) between 1 and 3000),
  status text not null default 'New' check (status in ('New','In progress','Resolved'))
);

alter table public.support_tickets enable row level security;
grant insert on public.support_tickets to anon, authenticated;
grant select, update, delete on public.support_tickets to authenticated;

drop policy if exists "support_tickets_public_submit" on public.support_tickets;
drop policy if exists "support_tickets_admin_read" on public.support_tickets;
drop policy if exists "support_tickets_admin_update" on public.support_tickets;
drop policy if exists "support_tickets_admin_delete" on public.support_tickets;

create policy "support_tickets_public_submit" on public.support_tickets
  for insert to anon, authenticated
  with check (
    length(trim(name)) between 1 and 100
    and length(trim(contact)) between 3 and 160
    and length(trim(subject)) between 1 and 140
    and length(trim(message)) between 1 and 3000
    and status = 'New'
  );
create policy "support_tickets_admin_read" on public.support_tickets
  for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "support_tickets_admin_update" on public.support_tickets
  for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');
create policy "support_tickets_admin_delete" on public.support_tickets
  for delete to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_tickets'
  ) then
    alter publication supabase_realtime add table public.support_tickets;
  end if;
end $$;
