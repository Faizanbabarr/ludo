-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Profiles table (stores user data + game stats)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  level int default 1 not null,
  xp int default 0 not null,
  coins numeric default 5000 not null,
  gems numeric default 50 not null,
  wins int default 0 not null,
  losses int default 0 not null,
  games_played int default 0 not null,
  win_streak int default 0 not null,
  best_streak int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- RLS policies
create policy "Anyone can view profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Player_' || left(new.id::text, 6)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on profiles
  for each row execute procedure public.handle_updated_at();

-- ===== ROOMS TABLE (Online Multiplayer) =====
create table rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  state jsonb not null default '{}',
  num_players int default 4 not null,
  host_id uuid references auth.users,
  -- Player slots: store user IDs for each position (0-3)
  player_ids text[] default array[]::text[] not null,
  -- Player usernames for display
  player_names text[] default array[]::text[] not null,
  status text default 'waiting' not null, -- waiting, playing, finished
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table rooms enable row level security;

-- Anyone can view rooms (needed to join by code)
create policy "Anyone can view rooms"
  on rooms for select using (true);

-- Authenticated users can create rooms
create policy "Authenticated users can create rooms"
  on rooms for insert with check (auth.uid() is not null);

-- Anyone can update rooms (game state changes during play)
create policy "Anyone can update rooms"
  on rooms for update using (true);

-- Auto-update updated_at on rooms
create trigger on_room_updated
  before update on rooms
  for each row execute procedure public.handle_updated_at();

-- Enable realtime for rooms table
alter publication supabase_realtime add table rooms;
