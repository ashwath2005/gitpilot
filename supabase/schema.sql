-- ==========================================================
-- GitPilot Cloud User Management — Supabase Schema & Security
-- ==========================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  status text default 'active' check (status in ('active', 'suspended', 'deleted')),
  plan text default 'free' check (plan in ('free', 'pro', 'lifetime')),
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now() not null,
  last_active timestamptz default now() not null
);

-- 2. Devices Table
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_id text not null,
  device_name text,
  os text,
  os_version text,
  app_version text,
  last_seen timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique (user_id, device_id)
);

-- 3. Indexes for High Performance
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_plan on public.profiles(plan);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_devices_user_id on public.devices(user_id);
create index if not exists idx_devices_device_id on public.devices(device_id);

-- 4. Secure Helper Function: Check Admin Status
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5. Trigger Function: Automatically create profile upon user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, status, plan, role, created_at, last_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'active',
    'free',
    'user',
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    last_active = now();
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.devices enable row level security;

-- 7. RLS Policies for Profiles
drop policy if exists "Profiles: select own or admin" on public.profiles;
create policy "Profiles: select own or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles: insert own or admin" on public.profiles;
create policy "Profiles: insert own or admin"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles: update own permitted or admin" on public.profiles;
create policy "Profiles: update own permitted or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin()
    or auth.uid() = id
  );

drop policy if exists "Profiles: delete admin only" on public.profiles;
create policy "Profiles: delete admin only"
  on public.profiles for delete
  using (public.is_admin());

-- 8. RLS Policies for Devices
drop policy if exists "Devices: select own or admin" on public.devices;
create policy "Devices: select own or admin"
  on public.devices for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Devices: insert own device" on public.devices;
create policy "Devices: insert own device"
  on public.devices for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Devices: update own device or admin" on public.devices;
create policy "Devices: update own device or admin"
  on public.devices for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Devices: delete own device or admin" on public.devices;
create policy "Devices: delete own device or admin"
  on public.devices for delete
  using (auth.uid() = user_id or public.is_admin());
