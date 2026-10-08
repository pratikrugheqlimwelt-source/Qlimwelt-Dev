-- Fix: "We couldn't load your profile" after schema reset / seed
-- Restores grants, RLS, and ensures pratikrughe.qlimwelt@gmail.com can read their profile + company.
-- Run in Supabase SQL Editor.

begin;

-- ---------------------------------------------------------------------------
-- 1) Privileges (often wiped by DROP SCHEMA public CASCADE)
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant execute on all functions in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to postgres, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) Profiles RLS — own row readable/writable
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3) company_members — allow reading YOUR membership without recursion traps
-- ---------------------------------------------------------------------------
alter table public.company_members enable row level security;

drop policy if exists "company_members_select" on public.company_members;
drop policy if exists company_members_select on public.company_members;
drop policy if exists company_members_select_own on public.company_members;

create policy company_members_select_own on public.company_members
  for select using (
    user_id = auth.uid()
    or public.is_company_member(company_id)
  );

-- ---------------------------------------------------------------------------
-- 4) Ensure demo user profile + company + membership
-- ---------------------------------------------------------------------------
do $$
declare
  v_user_id uuid;
  v_company_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('pratikrughe.qlimwelt@gmail.com')
  limit 1;

  if v_user_id is null then
    raise exception 'User not found — sign in once with Google first, then re-run this script';
  end if;

  insert into public.profiles (id, email, full_name, job_title, onboarding_completed, created_at, updated_at)
  values (
    v_user_id,
    'pratikrughe.qlimwelt@gmail.com',
    'Pratik Rughe',
    'Founder & CEO',
    true,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    job_title = excluded.job_title,
    onboarding_completed = true,
    updated_at = now();

  insert into public.companies (
    id, name, website, industry, company_size, headquarters_country,
    countries_of_operation, employee_count, annual_revenue, currency, facility_count
  ) values (
    v_company_id,
    'Nordic Manufacturing Group',
    'https://www.qlimwelt.de',
    'Industrial Manufacturing',
    '501-1000',
    'Germany',
    array['Germany','Netherlands'],
    842,
    124500000,
    'EUR',
    3
  )
  on conflict (id) do update set
    name = excluded.name,
    updated_at = now();

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, v_user_id, 'admin')
  on conflict (company_id, user_id) do update set role = 'admin';

  delete from public.company_members
  where user_id = v_user_id and company_id <> v_company_id;

  raise notice 'OK: profile + company ready for % (%)', 'pratikrughe.qlimwelt@gmail.com', v_user_id;
end $$;

commit;

-- Quick check (should return 1 row)
select p.id, p.email, p.onboarding_completed, cm.company_id, c.name as company_name
from public.profiles p
left join public.company_members cm on cm.user_id = p.id
left join public.companies c on c.id = cm.company_id
where lower(p.email) = lower('pratikrughe.qlimwelt@gmail.com');
