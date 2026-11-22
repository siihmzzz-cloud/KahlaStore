-- Ongoing customer/admin conversations for support tickets.
alter table public.support_tickets
  add column if not exists customer_token uuid;

update public.support_tickets
set customer_token = gen_random_uuid()
where customer_token is null;

alter table public.support_tickets
  alter column customer_token set default gen_random_uuid(),
  alter column customer_token set not null;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  created_at timestamptz not null default now(),
  sender text not null check (sender in ('customer', 'admin')),
  message text not null check (length(trim(message)) between 1 and 3000)
);

create index if not exists support_ticket_messages_ticket_created_idx
  on public.support_ticket_messages (ticket_id, created_at);

alter table public.support_ticket_messages enable row level security;
revoke all on public.support_ticket_messages from anon, authenticated;
grant select, insert on public.support_ticket_messages to authenticated;

drop policy if exists "support_messages_admin_read" on public.support_ticket_messages;
drop policy if exists "support_messages_admin_reply" on public.support_ticket_messages;

create policy "support_messages_admin_read" on public.support_ticket_messages
  for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com');

create policy "support_messages_admin_reply" on public.support_ticket_messages
  for insert to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'siihmzzz@gmail.com'
    and sender = 'admin'
    and length(trim(message)) between 1 and 3000
  );

create or replace function public.get_support_conversation(p_ticket_id text, p_customer_token uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ticket', jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'subject', t.subject,
      'status', t.status,
      'created_at', t.created_at
    ),
    'messages', jsonb_build_array(jsonb_build_object(
      'id', t.id || '-initial',
      'ticket_id', t.id,
      'created_at', t.created_at,
      'sender', 'customer',
      'message', t.message
    )) || coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'ticket_id', m.ticket_id,
        'created_at', m.created_at,
        'sender', m.sender,
        'message', m.message
      ) order by m.created_at, m.id)
      from public.support_ticket_messages m
      where m.ticket_id = t.id
    ), '[]'::jsonb)
  )
  from public.support_tickets t
  where t.id = p_ticket_id
    and t.customer_token = p_customer_token;
$$;

create or replace function public.send_support_message(p_ticket_id text, p_customer_token uuid, p_message text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.support_ticket_messages;
begin
  if length(trim(coalesce(p_message, ''))) not between 1 and 3000 then
    raise exception 'Message must be between 1 and 3000 characters.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.support_tickets t
    where t.id = p_ticket_id and t.customer_token = p_customer_token
  ) then
    raise exception 'Support conversation not found.' using errcode = 'P0002';
  end if;

  insert into public.support_ticket_messages (ticket_id, sender, message)
  values (p_ticket_id, 'customer', trim(p_message))
  returning * into inserted;

  return jsonb_build_object(
    'id', inserted.id,
    'ticket_id', inserted.ticket_id,
    'created_at', inserted.created_at,
    'sender', inserted.sender,
    'message', inserted.message
  );
end;
$$;

revoke all on function public.get_support_conversation(text, uuid) from public;
revoke all on function public.send_support_message(text, uuid, text) from public;
grant execute on function public.get_support_conversation(text, uuid) to anon, authenticated;
grant execute on function public.send_support_message(text, uuid, text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_ticket_messages'
  ) then
    alter publication supabase_realtime add table public.support_ticket_messages;
  end if;
end $$;
