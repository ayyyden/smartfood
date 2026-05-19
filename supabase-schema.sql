-- Run this entire script in your Supabase SQL Editor (supabase.com → SQL Editor)

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table public.profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade unique not null,
  date_of_birth        text,
  gender               text,
  height_cm            numeric,
  weight_kg            numeric,
  goal_weight_kg       numeric,
  unit_system          text default 'metric',
  goal                 text,
  activity_level       text,
  calorie_goal         integer default 1850,
  recommended_calories integer,
  calorie_overridden   boolean default false,
  protein_goal_g       integer default 140,
  carbs_goal_g         integer default 200,
  fat_goal_g           integer default 55,
  diet_rules           text[] default '{}',
  food_preferences     text default '',
  disliked_foods       text default '',
  onboarding_completed boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create table public.food_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  original_text text,
  logged_at     timestamptz default now(),
  date          text not null,
  date_key      text,              -- local browser date YYYY-MM-DD, used for per-day filtering
  calories      integer,
  protein       numeric,
  carbs         numeric,
  fat           numeric,
  items         jsonb,
  source        text,
  created_at    timestamptz default now()
);

create index food_entries_user_date_key_idx on public.food_entries (user_id, date_key);

create table public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  weight_kg  numeric not null,
  date       text not null,
  time       text,
  created_at timestamptz default now()
);

create table public.custom_foods (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  name              text not null,
  brand             text,
  serving_amount    numeric,
  serving_unit      text,
  custom_unit_name  text,
  grams_per_serving numeric,
  calories          integer,
  protein           numeric,
  carbs             numeric,
  fat               numeric,
  is_favorite       boolean default false,
  is_verified       boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── Role privileges ─────────────────────────────────────────────────────────
-- RLS policies filter which rows each user can see, but they do NOT grant
-- table-level access. Without explicit GRANTs the authenticated role gets
-- "permission denied for table …" (code 42501) even when RLS would pass.

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles     to authenticated;
grant select, insert, update, delete on public.food_entries to authenticated;
grant select, insert, update, delete on public.weight_logs  to authenticated;
grant select, insert, update, delete on public.custom_foods to authenticated;

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles    enable row level security;
alter table public.food_entries enable row level security;
alter table public.weight_logs  enable row level security;
alter table public.custom_foods enable row level security;

-- profiles
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = user_id);
create policy "profiles: own insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles: own delete" on public.profiles for delete using (auth.uid() = user_id);

-- food_entries
create policy "food: own read"   on public.food_entries for select using (auth.uid() = user_id);
create policy "food: own insert" on public.food_entries for insert with check (auth.uid() = user_id);
create policy "food: own update" on public.food_entries for update using (auth.uid() = user_id);
create policy "food: own delete" on public.food_entries for delete using (auth.uid() = user_id);

-- weight_logs
create policy "weight: own read"   on public.weight_logs for select using (auth.uid() = user_id);
create policy "weight: own insert" on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "weight: own update" on public.weight_logs for update using (auth.uid() = user_id);
create policy "weight: own delete" on public.weight_logs for delete using (auth.uid() = user_id);

-- custom_foods
create policy "custom: own read"   on public.custom_foods for select using (auth.uid() = user_id);
create policy "custom: own insert" on public.custom_foods for insert with check (auth.uid() = user_id);
create policy "custom: own update" on public.custom_foods for update using (auth.uid() = user_id);
create policy "custom: own delete" on public.custom_foods for delete using (auth.uid() = user_id);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_custom_foods_updated_at
  before update on public.custom_foods
  for each row execute function public.set_updated_at();
