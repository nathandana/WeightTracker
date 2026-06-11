-- DownTrack — Supabase schema
-- Run this in the Supabase dashboard: SQL Editor → New Query → paste & run

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per user; mirrors the app's profile object.
-- id must match auth.users.id so RLS policies resolve correctly.

create table if not exists public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  display_name    text,
  weight_unit     text        not null default 'lbs',
  height_unit     text        not null default 'imperial',
  start_weight    numeric,
  goal_weight     numeric,
  height          numeric,        -- cm when heightUnit = 'cm'
  height_feet     integer,
  height_inches   integer,
  age             integer,
  sex             text,
  activity_level  text,
  daily_calories  text,
  meds            text[]      not null default '{}',
  other_med       text,
  start_date      timestamptz,
  goal_date       date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user reads own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: user inserts own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: user updates own" on public.profiles for update using (auth.uid() = id);
create policy "profiles: user deletes own" on public.profiles for delete using (auth.uid() = id);

-- ─── weight_entries ───────────────────────────────────────────────────────────
-- One row per user per day. The unique constraint on (user_id, entry_date) lets
-- the app upsert by date without creating duplicates.

create table if not exists public.weight_entries (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  weight        numeric     not null,
  mood          text,
  activity      text,
  calories      text,
  notes         text,
  entry_date    date        not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.weight_entries enable row level security;

create policy "entries: user reads own"   on public.weight_entries for select using (auth.uid() = user_id);
create policy "entries: user inserts own" on public.weight_entries for insert with check (auth.uid() = user_id);
create policy "entries: user updates own" on public.weight_entries for update using (auth.uid() = user_id);
create policy "entries: user deletes own" on public.weight_entries for delete using (auth.uid() = user_id);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger weight_entries_updated_at
  before update on public.weight_entries
  for each row execute function public.set_updated_at();
