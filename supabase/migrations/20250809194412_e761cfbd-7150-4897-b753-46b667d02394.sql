
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1) Public profiles (no FK to auth.users; RLS enforced with auth.uid())
create table if not exists public.profiles (
  user_id uuid primary key,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can read public profiles (can be tightened later)
create policy "Anyone can read profiles"
  on public.profiles
  for select
  using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id);

-- 2) Whiskies master data (read-only from client)
create table if not exists public.whiskies (
  id uuid primary key default gen_random_uuid(),
  distillery text not null,
  name text not null,
  region text not null,
  abv numeric(5,2),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.whiskies enable row level security;

-- Anyone can read whiskies
create policy "Anyone can read whiskies"
  on public.whiskies
  for select
  using (true);

-- 3) Tasting notes (one per user per whisky) with flavor tags
create table if not exists public.tasting_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  whisky_id uuid not null references public.whiskies(id) on delete cascade,
  rating int check (rating between 0 and 100), -- use 0-100; can map from 1-5 UI
  note text,
  flavors text[] not null default '{}',        -- e.g. '{Green Apple, Vanilla}'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, whisky_id)
);

-- Helpful indexes
create index if not exists idx_tasting_notes_whisky on public.tasting_notes(whisky_id);
create index if not exists idx_tasting_notes_flavors_gin on public.tasting_notes using gin (flavors);

alter table public.tasting_notes enable row level security;

-- RLS: users can read their own notes
create policy "Users can read their own notes"
  on public.tasting_notes
  for select
  using (auth.uid() = user_id);

-- RLS: users can insert their own notes
create policy "Users can insert their own notes"
  on public.tasting_notes
  for insert
  with check (auth.uid() = user_id);

-- RLS: users can update their own notes
create policy "Users can update their own notes"
  on public.tasting_notes
  for update
  using (auth.uid() = user_id);

-- RLS: users can delete their own notes
create policy "Users can delete their own notes"
  on public.tasting_notes
  for delete
  using (auth.uid() = user_id);

-- Maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasting_notes_updated_at on public.tasting_notes;
create trigger trg_tasting_notes_updated_at
before update on public.tasting_notes
for each row
execute function public.set_updated_at();

-- 4) Community flavor distribution (SECURITY DEFINER bypasses RLS; returns only aggregates)
create or replace function public.get_flavor_distribution(_whisky_id uuid)
returns table(flavor text, count bigint, percentage numeric)
language sql
security definer
set search_path = public
as $$
  with total as (
    select count(*)::numeric as n
    from public.tasting_notes
    where whisky_id = _whisky_id
  )
  select
    f.flavor,
    count(*)::bigint as count,
    case
      when t.n = 0 then 0
      else round((count(*)::numeric / t.n) * 100, 2)
    end as percentage
  from public.tasting_notes tn
  cross join unnest(tn.flavors) as f(flavor)
  cross join total t
  where tn.whisky_id = _whisky_id
  group by f.flavor, t.n
  order by count desc, flavor asc;
$$;

-- 5) Single-flavor percentage helper (e.g., “Green Apple”)
create or replace function public.get_flavor_percentage(_whisky_id uuid, _flavor text)
returns numeric
language sql
security definer
set search_path = public
as $$
  with total as (
    select count(*)::numeric as n
    from public.tasting_notes
    where whisky_id = _whisky_id
  ),
  flavor_count as (
    select count(*)::numeric as c
    from public.tasting_notes tn
    where tn.whisky_id = _whisky_id
      and _flavor = any(tn.flavors)
  )
  select case when t.n = 0 then 0 else round((fc.c / t.n) * 100, 2) end
  from total t, flavor_count fc;
$$;
