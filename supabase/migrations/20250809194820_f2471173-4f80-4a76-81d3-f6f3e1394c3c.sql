
-- 1) Utility: updated_at trigger function (used by multiple tables)
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Profiles: nickname for public identity
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid());

create policy "Users can delete their own profile"
  on public.profiles
  for delete
  to authenticated
  using (id = auth.uid());

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- Auto-create profile with nickname at signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', 'Explorer-' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Whiskies catalog (public data powering Explore + Sets)
create table if not exists public.whiskies (
  id uuid primary key default gen_random_uuid(),
  distillery text not null,
  name text not null,
  region text,
  abv numeric(5,2),
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.whiskies enable row level security;

create policy "Whiskies readable by everyone"
  on public.whiskies
  for select
  using (true);

-- 4) Tasting sets (box experiences)
create table if not exists public.tasting_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_img text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tasting_sets enable row level security;

create policy "Tasting sets readable by authenticated"
  on public.tasting_sets
  for select
  to authenticated
  using (true);

-- 5) Activation codes (kept secret from clients)
create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.tasting_sets(id) on delete cascade,
  code text not null unique,
  max_redemptions int not null default 1,
  redemption_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.activation_codes enable row level security;

-- Restrictive policy: no direct access from clients
create policy "No direct access to activation_codes"
  on public.activation_codes
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

-- 6) User activations: which user unlocked which set
create table if not exists public.set_activations (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.tasting_sets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  activated_at timestamptz not null default now(),
  unique (set_id, user_id)
);

alter table public.set_activations enable row level security;

create policy "Users can view their own set activations"
  on public.set_activations
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own set activations"
  on public.set_activations
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Secure redemption function: validate code and unlock set
create or replace function public.redeem_tasting_code(p_code text)
returns public.set_activations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code activation_codes%rowtype;
  v_activation set_activations%rowtype;
begin
  select * into v_code
  from public.activation_codes
  where code = p_code;

  if not found then
    raise exception 'Invalid or unknown activation code';
  end if;

  if v_code.redemption_count >= v_code.max_redemptions then
    raise exception 'This activation code has already been used';
  end if;

  insert into public.set_activations (set_id, user_id, code)
  values (v_code.set_id, auth.uid(), p_code)
  on conflict (set_id, user_id) do update
    set activated_at = excluded.activated_at
  returning * into v_activation;

  update public.activation_codes
  set redemption_count = redemption_count + 1
  where id = v_code.id;

  return v_activation;
end;
$$;

-- 7) Which whiskies belong to a set (and in what order)
create table if not exists public.tasting_set_whiskies (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.tasting_sets(id) on delete cascade,
  whisky_id uuid not null references public.whiskies(id) on delete cascade,
  position int not null default 1,
  unique (set_id, whisky_id)
);

alter table public.tasting_set_whiskies enable row level security;

create policy "Set whiskies readable by authenticated"
  on public.tasting_set_whiskies
  for select
  to authenticated
  using (true);

-- 8) Module progress (History, Technique, Flavour Language, etc.)
create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid not null references public.tasting_sets(id) on delete cascade,
  module_key text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, set_id, module_key)
);

alter table public.module_progress enable row level security;

create policy "Users manage their own module progress"
  on public.module_progress
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 9) Tasting notes (used by both Guided Tasting and Explore)
create table if not exists public.tasting_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  whisky_id uuid not null references public.whiskies(id) on delete cascade,
  set_id uuid references public.tasting_sets(id) on delete set null,
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasting_notes enable row level security;

create policy "Any authenticated user can read tasting notes"
  on public.tasting_notes
  for select
  to authenticated
  using (true);

create policy "Users can insert their own notes"
  on public.tasting_notes
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own notes"
  on public.tasting_notes
  for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own notes"
  on public.tasting_notes
  for delete
  to authenticated
  using (user_id = auth.uid());

create trigger tasting_notes_updated_at
  before update on public.tasting_notes
  for each row execute procedure public.update_updated_at();

create index if not exists idx_tasting_notes_lookup
  on public.tasting_notes (whisky_id, set_id, user_id);

-- 10) Per-note flavors (easier aggregation of percentages)
create table if not exists public.tasting_note_flavors (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.tasting_notes(id) on delete cascade,
  flavor_key text not null
);

alter table public.tasting_note_flavors enable row level security;

create policy "Any authenticated user can read note flavors"
  on public.tasting_note_flavors
  for select
  to authenticated
  using (true);

create policy "Users can insert flavors for their own notes"
  on public.tasting_note_flavors
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tasting_notes tn
      where tn.id = note_id and tn.user_id = auth.uid()
    )
  );

create policy "Users can delete flavors for their own notes"
  on public.tasting_note_flavors
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.tasting_notes tn
      where tn.id = note_id and tn.user_id = auth.uid()
    )
  );

create index if not exists idx_note_flavors_note
  on public.tasting_note_flavors (note_id);

create index if not exists idx_note_flavors_key
  on public.tasting_note_flavors (flavor_key);

-- 11) Community flavor percentages view (e.g., 'Green Apple' = 42.5%)
create or replace view public.community_flavor_stats as
with totals as (
  select whisky_id, count(distinct user_id) as total_users
  from public.tasting_notes
  group by whisky_id
)
select
  tn.whisky_id,
  fn.flavor_key,
  count(distinct tn.user_id) as users_with_flavor,
  t.total_users,
  case when t.total_users = 0 then 0
       else round((count(distinct tn.user_id)::numeric * 100.0) / t.total_users, 1)
  end as percentage
from public.tasting_note_flavors fn
join public.tasting_notes tn on tn.id = fn.note_id
join totals t on t.whisky_id = tn.whisky_id
group by tn.whisky_id, fn.flavor_key, t.total_users;

grant select on public.community_flavor_stats to anon, authenticated;
