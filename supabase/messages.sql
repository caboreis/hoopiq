-- HoopIQ — Vestiaire (chat communautaire temps réel)
-- À exécuter dans Supabase → SQL Editor

create table if not exists public.messages (
  id           bigint generated always as identity primary key,
  room         text not null,
  author       text not null,
  author_email text,
  text         text not null,
  is_ai        boolean not null default false,
  client_id    text,
  created_at   timestamptz not null default now()
);

-- If the table already existed without client_id, add it:
alter table public.messages add column if not exists client_id text;

-- Index pour charger vite l'historique d'un salon
create index if not exists messages_room_created_idx
  on public.messages (room, created_at);

-- Row Level Security : lecture + écriture ouvertes (chat public)
alter table public.messages enable row level security;

drop policy if exists "messages_select_all" on public.messages;
create policy "messages_select_all" on public.messages
  for select using (true);

drop policy if exists "messages_insert_all" on public.messages;
create policy "messages_insert_all" on public.messages
  for insert with check (true);

-- Active Supabase Realtime sur la table
alter publication supabase_realtime add table public.messages;
