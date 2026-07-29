-- Qlimwelt dashboard carbon schema
-- Run after 001_auth_and_onboarding.sql

-- ---------------------------------------------------------------------------
-- Company settings (carbon price, GWP, custom factors JSON)
-- ---------------------------------------------------------------------------
create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  carbon_price_per_tonne numeric not null default 85,
  discount_rate numeric not null default 0.08,
  units_produced integer not null default 0,
  baseline_year integer not null default 2023,
  reporting_year integer not null default 2024,
  custom_factors jsonb not null default '[]'::jsonb,
  seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists company_settings_updated_at on public.company_settings;
create trigger company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Facilities
-- ---------------------------------------------------------------------------
create table if not exists public.facilities (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  country text not null,
  business_unit_id text not null default 'bu-ops',
  type text not null default 'Facility',
  floor_area_m2 numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_facilities_company on public.facilities(company_id);

drop trigger if exists facilities_updated_at on public.facilities;
create trigger facilities_updated_at
  before update on public.facilities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
create table if not exists public.vehicles (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  manufacturer text not null default '',
  model text not null default '',
  category text not null default 'Van',
  fuel_type text not null default 'Diesel',
  registration text not null default '',
  ownership text not null default 'Company owned',
  facility_id text not null,
  country text not null default '',
  year integer not null default 2024,
  distance_km numeric not null default 0,
  fuel_litres numeric not null default 0,
  electricity_kwh numeric not null default 0,
  emission_factor numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_company on public.vehicles(company_id);

drop trigger if exists vehicles_updated_at on public.vehicles;
create trigger vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  country text not null default '',
  category text not null default '',
  scope3_tco2e numeric not null default 0,
  data_quality_score numeric not null default 50,
  influence_score numeric not null default 50,
  reduction_opportunity numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suppliers_company on public.suppliers(company_id);

-- ---------------------------------------------------------------------------
-- Emission activities
-- ---------------------------------------------------------------------------
create table if not exists public.emission_activities (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  period text not null,
  facility_id text not null,
  country text not null,
  business_unit_id text not null,
  scope text not null check (scope in ('scope1', 'scope2', 'scope3')),
  category text not null,
  subcategory text not null default '',
  source text not null default '',
  activity_value numeric not null default 0,
  activity_unit text not null default '',
  emission_factor_id text not null default '',
  emission_factor_value numeric not null default 0,
  emission_factor_unit text not null default '',
  emission_factor_source text not null default '',
  emission_factor_year integer not null default 2024,
  conversion_factor numeric not null default 1,
  ghg text not null default 'CO2',
  gwp numeric not null default 1,
  method text not null default 'estimated',
  data_quality_score numeric not null default 50,
  uncertainty_pct numeric not null default 10,
  evidence_status text not null default 'pending',
  resource_id text,
  is_estimated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_emission_activities_company on public.emission_activities(company_id);
create index if not exists idx_emission_activities_period on public.emission_activities(company_id, period);
create index if not exists idx_emission_activities_scope on public.emission_activities(company_id, scope);

drop trigger if exists emission_activities_updated_at on public.emission_activities;
create trigger emission_activities_updated_at
  before update on public.emission_activities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reduction initiatives
-- ---------------------------------------------------------------------------
create table if not exists public.reduction_initiatives (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null default '',
  source text not null default '',
  implementation_cost numeric not null default 0,
  annual_operating_cost numeric not null default 0,
  annual_financial_saving numeric not null default 0,
  annual_emission_reduction_tco2e numeric not null default 0,
  implementation_date text not null default '',
  confidence numeric not null default 70,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  expected_lifetime_years numeric not null default 5,
  difficulty text not null default 'medium' check (difficulty in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reduction_initiatives_company on public.reduction_initiatives(company_id);

drop trigger if exists reduction_initiatives_updated_at on public.reduction_initiatives;
create trigger reduction_initiatives_updated_at
  before update on public.reduction_initiatives
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Climate targets
-- ---------------------------------------------------------------------------
create table if not exists public.climate_targets (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  baseline_year integer not null,
  target_year integer not null,
  baseline_emissions_tco2e numeric not null,
  target_reduction_pct numeric not null,
  type text not null default 'absolute' check (type in ('absolute', 'intensity')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_climate_targets_company on public.climate_targets(company_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null default '',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_company on public.notifications(company_id);
create index if not exists idx_notifications_user on public.notifications(user_id);

-- ---------------------------------------------------------------------------
-- Team invites (pending)
-- ---------------------------------------------------------------------------
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'manager', 'member', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now()
);

create index if not exists idx_team_invites_company on public.team_invites(company_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.company_settings enable row level security;
alter table public.facilities enable row level security;
alter table public.vehicles enable row level security;
alter table public.suppliers enable row level security;
alter table public.emission_activities enable row level security;
alter table public.reduction_initiatives enable row level security;
alter table public.climate_targets enable row level security;
alter table public.notifications enable row level security;
alter table public.team_invites enable row level security;

-- company_settings
drop policy if exists company_settings_select on public.company_settings;
create policy company_settings_select on public.company_settings for select using (public.is_company_member(company_id));
drop policy if exists company_settings_upsert on public.company_settings;
create policy company_settings_insert on public.company_settings for insert with check (public.is_company_member(company_id));
drop policy if exists company_settings_update on public.company_settings;
create policy company_settings_update on public.company_settings for update using (public.is_company_admin(company_id));

-- facilities
drop policy if exists facilities_select on public.facilities;
create policy facilities_select on public.facilities for select using (public.is_company_member(company_id));
drop policy if exists facilities_write on public.facilities;
create policy facilities_insert on public.facilities for insert with check (public.is_company_member(company_id));
create policy facilities_update on public.facilities for update using (public.is_company_member(company_id));
create policy facilities_delete on public.facilities for delete using (public.is_company_admin(company_id));

-- vehicles
drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles for select using (public.is_company_member(company_id));
create policy vehicles_insert on public.vehicles for insert with check (public.is_company_member(company_id));
create policy vehicles_update on public.vehicles for update using (public.is_company_member(company_id));
create policy vehicles_delete on public.vehicles for delete using (public.is_company_admin(company_id));

-- suppliers
create policy suppliers_select on public.suppliers for select using (public.is_company_member(company_id));
create policy suppliers_insert on public.suppliers for insert with check (public.is_company_member(company_id));
create policy suppliers_update on public.suppliers for update using (public.is_company_member(company_id));
create policy suppliers_delete on public.suppliers for delete using (public.is_company_admin(company_id));

-- emission_activities
create policy emission_activities_select on public.emission_activities for select using (public.is_company_member(company_id));
create policy emission_activities_insert on public.emission_activities for insert with check (public.is_company_member(company_id));
create policy emission_activities_update on public.emission_activities for update using (public.is_company_member(company_id));
create policy emission_activities_delete on public.emission_activities for delete using (public.is_company_admin(company_id));

-- reduction_initiatives
create policy reduction_initiatives_select on public.reduction_initiatives for select using (public.is_company_member(company_id));
create policy reduction_initiatives_insert on public.reduction_initiatives for insert with check (public.is_company_member(company_id));
create policy reduction_initiatives_update on public.reduction_initiatives for update using (public.is_company_member(company_id));
create policy reduction_initiatives_delete on public.reduction_initiatives for delete using (public.is_company_admin(company_id));

-- climate_targets
create policy climate_targets_select on public.climate_targets for select using (public.is_company_member(company_id));
create policy climate_targets_insert on public.climate_targets for insert with check (public.is_company_admin(company_id));
create policy climate_targets_update on public.climate_targets for update using (public.is_company_admin(company_id));

-- notifications
create policy notifications_select on public.notifications for select using (
  public.is_company_member(company_id)
  and (user_id is null or user_id = auth.uid())
);
create policy notifications_insert on public.notifications for insert with check (public.is_company_member(company_id));
create policy notifications_update on public.notifications for update using (
  public.is_company_member(company_id)
  and (user_id is null or user_id = auth.uid())
);

-- team_invites
create policy team_invites_select on public.team_invites for select using (public.is_company_member(company_id));
create policy team_invites_insert on public.team_invites for insert with check (public.is_company_admin(company_id));
create policy team_invites_update on public.team_invites for update using (public.is_company_admin(company_id));
