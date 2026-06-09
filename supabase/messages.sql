-- HoopIQ — Vestiaire (chat communautaire temps réel)
-- À exécuter dans Supabase → SQL Editor.
-- ⚠️ Recrée la table proprement (supprime l'ancienne structure incompatible).

drop table if exists public.messages cascade;

create table public.messages (
  id           bigint generated always as identity primary key,
  room         text not null,
  author       text not null,
  author_email text,
  text         text not null,
  is_ai        boolean not null default false,
  client_id    text,
  created_at   timestamptz not null default now()
);

-- Index pour charger vite l'historique d'un salon
create index messages_room_created_idx on public.messages (room, created_at);

-- Row Level Security : lecture + écriture ouvertes (chat public)
alter table public.messages enable row level security;

create policy "messages_select_all" on public.messages
  for select using (true);

create policy "messages_insert_all" on public.messages
  for insert with check (true);

-- Active Supabase Realtime sur la table
alter publication supabase_realtime add table public.messages;
