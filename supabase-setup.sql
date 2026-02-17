-- Run this in your Supabase project (SQL Editor) to enable online multiplayer.

-- Table for game rooms
create table if not exists public.rooms (
  code text primary key,
  state jsonb not null,
  num_players smallint not null default 4,
  updated_at timestamptz not null default now()
);

-- Allow anonymous read/write for the app (restrict with RLS in production if needed)
alter table public.rooms enable row level security;

create policy "Allow all for rooms"
  on public.rooms for all
  using (true)
  with check (true);

-- Enable Realtime: In Supabase Dashboard go to Database → Replication,
-- then add table "rooms" to the publication.
-- Optionally: alter table public.rooms replica identity full;
