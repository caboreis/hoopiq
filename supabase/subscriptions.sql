-- HoopIQ — Abonnements Stripe
-- À exécuter dans Supabase → SQL Editor.
-- ⚠️ Recrée la table proprement (l'ancienne structure incompatible est vide, aucune perte).

drop table if exists public.subscriptions cascade;

create table public.subscriptions (
  id                     bigint generated always as identity primary key,
  email                  text not null unique,
  plan                   text not null check (plan in ('scout', 'pro', 'elite')),
  status                 text not null default 'active',
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_session_id      text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index subscriptions_email_idx on public.subscriptions (email);

-- Row Level Security : lecture ouverte (le front affiche le plan),
-- écriture réservée au serveur (la clé service_role contourne RLS).
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_all" on public.subscriptions
  for select using (true);
