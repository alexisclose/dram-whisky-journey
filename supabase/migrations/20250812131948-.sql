-- Create wishlists table for users to save whiskies
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  whisky_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wishlists_user_whisky_unique unique (user_id, whisky_id)
);

-- Enable RLS
alter table public.wishlists enable row level security;

-- Policies: users can manage their own wishlists
create policy if not exists "Users can read their own wishlists"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert into their wishlists"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can delete from their wishlists"
  on public.wishlists for delete
  using (auth.uid() = user_id);

-- Optional: allow updates (not required for current feature but safe)
create policy if not exists "Users can update their own wishlists"
  on public.wishlists for update
  using (auth.uid() = user_id);

-- Trigger to maintain updated_at
create trigger if not exists set_wishlists_updated_at
before update on public.wishlists
for each row execute function public.set_updated_at();

-- Indexes for performance
create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_wishlists_whisky_id on public.wishlists(whisky_id);
