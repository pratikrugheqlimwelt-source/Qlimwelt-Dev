-- Qlimwelt auth & onboarding schema
-- Run the ENTIRE file in Supabase SQL Editor (Ctrl+A in this file, paste, Run)

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  profile_image_url text,
  job_title text,
  phone text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  company_size text,
  headquarters_country text,
  countries_of_operation text[] default '{}',
  employee_count integer,
  annual_revenue numeric,
  currency text default 'EUR',
  facility_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Company members (must exist before membership helper functions)
-- ---------------------------------------------------------------------------
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'manager', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create index if not exists idx_company_members_user_id on public.company_members(user_id);
create index if not exists idx_company_members_company_id on public.company_members(company_id);

-- ---------------------------------------------------------------------------
-- Onboarding responses
-- ---------------------------------------------------------------------------
create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  emission_measurement_status text,
  measured_scopes text[] default '{}',
  has_climate_target boolean,
  reporting_standards text[] default '{}',
  interests text[] default '{}',
  sustainability_challenge text,
  implementation_timeline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, company_id)
);

create index if not exists idx_onboarding_responses_user_id on public.onboarding_responses(user_id);
create index if not exists idx_onboarding_responses_company_id on public.onboarding_responses(company_id);

drop trigger if exists onboarding_responses_updated_at on public.onboarding_responses;
create trigger onboarding_responses_updated_at
  before update on public.onboarding_responses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: check company membership (requires company_members table)
-- ---------------------------------------------------------------------------
create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, profile_image_url, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.email, new.raw_user_meta_data->>'email'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    false
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email),
    profile_image_url = coalesce(excluded.profile_image_url, public.profiles.profile_image_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic onboarding completion RPC
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_existing boolean;
  p_personal jsonb := payload->'personal';
  p_company jsonb := payload->'company';
  p_climate jsonb := payload->'climate';
  p_interests jsonb := payload->'interests';
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select onboarding_completed into v_existing
  from public.profiles
  where id = v_user_id;

  if v_existing is true then
    select company_id into v_company_id
    from public.company_members
    where user_id = v_user_id
    limit 1;
    return v_company_id;
  end if;

  insert into public.companies (
    name, website, industry, company_size, headquarters_country,
    countries_of_operation, employee_count, annual_revenue, currency, facility_count
  ) values (
    p_company->>'name',
    nullif(p_company->>'website', ''),
    nullif(p_company->>'industry', ''),
    nullif(p_company->>'company_size', ''),
    nullif(p_company->>'headquarters_country', ''),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_company->'countries_of_operation', '[]'::jsonb)) as t(x)),
      '{}'::text[]
    ),
    nullif(p_company->>'employee_count', '')::integer,
    nullif(p_company->>'annual_revenue', '')::numeric,
    coalesce(nullif(p_company->>'currency', ''), 'EUR'),
    nullif(p_company->>'facility_count', '')::integer
  )
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, v_user_id, 'admin');

  insert into public.onboarding_responses (
    user_id, company_id,
    emission_measurement_status, measured_scopes, has_climate_target,
    reporting_standards, interests, sustainability_challenge, implementation_timeline
  ) values (
    v_user_id, v_company_id,
    nullif(p_climate->>'emission_measurement_status', ''),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_climate->'measured_scopes', '[]'::jsonb)) as t(x)),
      '{}'::text[]
    ),
    (p_climate->>'has_climate_target')::boolean,
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_climate->'reporting_standards', '[]'::jsonb)) as t(x)),
      '{}'::text[]
    ),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_interests->'interests', '[]'::jsonb)) as t(x)),
      '{}'::text[]
    ),
    nullif(p_interests->>'sustainability_challenge', ''),
    nullif(p_interests->>'implementation_timeline', '')
  );

  update public.profiles set
    full_name = coalesce(nullif(p_personal->>'full_name', ''), full_name),
    email = coalesce(nullif(p_personal->>'email', ''), email),
    job_title = nullif(p_personal->>'job_title', ''),
    phone = nullif(p_personal->>'phone', ''),
    onboarding_completed = true,
    updated_at = now()
  where id = v_user_id;

  return v_company_id;
end;
$$;

grant execute on function public.complete_onboarding(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.onboarding_responses enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "companies_select_member" on public.companies;
create policy "companies_select_member" on public.companies
  for select using (public.is_company_member(id));

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin" on public.companies
  for update using (public.is_company_admin(id));

drop policy if exists "company_members_select" on public.company_members;
create policy "company_members_select" on public.company_members
  for select using (public.is_company_member(company_id));

drop policy if exists "company_members_insert_admin" on public.company_members;
create policy "company_members_insert_admin" on public.company_members
  for insert with check (public.is_company_admin(company_id));

drop policy if exists "company_members_update_admin" on public.company_members;
create policy "company_members_update_admin" on public.company_members
  for update using (public.is_company_admin(company_id));

drop policy if exists "company_members_delete_admin" on public.company_members;
create policy "company_members_delete_admin" on public.company_members
  for delete using (public.is_company_admin(company_id));

drop policy if exists "onboarding_select_member" on public.onboarding_responses;
create policy "onboarding_select_member" on public.onboarding_responses
  for select using (public.is_company_member(company_id));

drop policy if exists "onboarding_insert_own" on public.onboarding_responses;
create policy "onboarding_insert_own" on public.onboarding_responses
  for insert with check (auth.uid() = user_id);

-- Allow company insert during onboarding via RPC (security definer bypasses RLS)
