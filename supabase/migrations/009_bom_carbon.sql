-- Phase 1B: carbon datasets, emission factors, BOM item mappings, calculation runs + ledger

create table if not exists public.carbon_datasets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  source text not null default 'custom',
  geography text not null default 'GLO',
  methodology text not null default 'ipcc_ar6',
  version_label text not null default '1',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code, version_label)
);

create index if not exists idx_carbon_datasets_company on public.carbon_datasets(company_id);

create table if not exists public.emission_factors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  dataset_id uuid not null references public.carbon_datasets(id) on delete cascade,
  factor_code text not null,
  name text not null,
  category text not null default 'material',
  activity_unit text not null default 'kg',
  value_kgco2e numeric not null check (value_kgco2e >= 0),
  uncertainty numeric check (uncertainty is null or (uncertainty >= 0 and uncertainty <= 1)),
  geography text not null default 'GLO',
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dataset_id, factor_code)
);

create index if not exists idx_emission_factors_company on public.emission_factors(company_id);
create index if not exists idx_emission_factors_dataset on public.emission_factors(dataset_id);
create index if not exists idx_emission_factors_code on public.emission_factors(company_id, factor_code);

create table if not exists public.carbon_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bom_item_id uuid not null references public.bom_items(id) on delete cascade,
  emission_factor_id uuid not null references public.emission_factors(id) on delete restrict,
  method text not null default 'qty_x_ef'
    check (method in ('qty_x_ef', 'supplier_pcf', 'activity_data', 'spend', 'process')),
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  status text not null default 'suggested'
    check (status in ('suggested', 'approved', 'rejected', 'stale')),
  match_reason text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bom_item_id)
);

create index if not exists idx_carbon_mappings_company on public.carbon_mappings(company_id);
create index if not exists idx_carbon_mappings_item on public.carbon_mappings(bom_item_id);
create index if not exists idx_carbon_mappings_factor on public.carbon_mappings(emission_factor_id);
create index if not exists idx_carbon_mappings_status on public.carbon_mappings(company_id, status);

create table if not exists public.pcf_calculations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  bom_id uuid not null references public.boms(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  status text not null default 'completed'
    check (status in ('draft', 'completed', 'failed', 'superseded')),
  total_kgco2e numeric not null default 0,
  declared_unit text not null default 'piece',
  methodology text not null default 'bom_recursive_v1',
  warnings jsonb not null default '[]'::jsonb,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_pcf_calculations_company on public.pcf_calculations(company_id);
create index if not exists idx_pcf_calculations_bom on public.pcf_calculations(bom_id);
create index if not exists idx_pcf_calculations_product on public.pcf_calculations(product_id);
create index if not exists idx_pcf_calculations_assessment on public.pcf_calculations(assessment_id);

create table if not exists public.carbon_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  calculation_id uuid not null references public.pcf_calculations(id) on delete cascade,
  bom_item_id uuid references public.bom_items(id) on delete set null,
  parent_entry_id uuid references public.carbon_ledger_entries(id) on delete cascade,
  part_number text not null,
  contribution_kgco2e numeric not null default 0,
  activity_quantity numeric not null default 0,
  activity_unit text not null default 'kg',
  emission_factor_id uuid references public.emission_factors(id) on delete set null,
  mapping_id uuid references public.carbon_mappings(id) on delete set null,
  method text not null default 'qty_x_ef',
  confidence numeric,
  provenance jsonb not null default '{}'::jsonb,
  sequence_no integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_carbon_ledger_calc on public.carbon_ledger_entries(calculation_id);
create index if not exists idx_carbon_ledger_company on public.carbon_ledger_entries(company_id);
create index if not exists idx_carbon_ledger_item on public.carbon_ledger_entries(bom_item_id);

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    drop trigger if exists carbon_datasets_updated_at on public.carbon_datasets;
    create trigger carbon_datasets_updated_at
      before update on public.carbon_datasets
      for each row execute function public.set_updated_at();

    drop trigger if exists emission_factors_updated_at on public.emission_factors;
    create trigger emission_factors_updated_at
      before update on public.emission_factors
      for each row execute function public.set_updated_at();

    drop trigger if exists carbon_mappings_updated_at on public.carbon_mappings;
    create trigger carbon_mappings_updated_at
      before update on public.carbon_mappings
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.carbon_datasets enable row level security;
alter table public.emission_factors enable row level security;
alter table public.carbon_mappings enable row level security;
alter table public.pcf_calculations enable row level security;
alter table public.carbon_ledger_entries enable row level security;

drop policy if exists carbon_datasets_select on public.carbon_datasets;
create policy carbon_datasets_select on public.carbon_datasets
  for select using (public.is_company_member(company_id));
drop policy if exists carbon_datasets_insert on public.carbon_datasets;
create policy carbon_datasets_insert on public.carbon_datasets
  for insert with check (public.is_company_member(company_id));
drop policy if exists carbon_datasets_update on public.carbon_datasets;
create policy carbon_datasets_update on public.carbon_datasets
  for update using (public.is_company_member(company_id));
drop policy if exists carbon_datasets_delete on public.carbon_datasets;
create policy carbon_datasets_delete on public.carbon_datasets
  for delete using (public.is_company_admin(company_id));

drop policy if exists emission_factors_select on public.emission_factors;
create policy emission_factors_select on public.emission_factors
  for select using (public.is_company_member(company_id));
drop policy if exists emission_factors_insert on public.emission_factors;
create policy emission_factors_insert on public.emission_factors
  for insert with check (public.is_company_member(company_id));
drop policy if exists emission_factors_update on public.emission_factors;
create policy emission_factors_update on public.emission_factors
  for update using (public.is_company_member(company_id));
drop policy if exists emission_factors_delete on public.emission_factors;
create policy emission_factors_delete on public.emission_factors
  for delete using (public.is_company_admin(company_id));

drop policy if exists carbon_mappings_select on public.carbon_mappings;
create policy carbon_mappings_select on public.carbon_mappings
  for select using (public.is_company_member(company_id));
drop policy if exists carbon_mappings_insert on public.carbon_mappings;
create policy carbon_mappings_insert on public.carbon_mappings
  for insert with check (public.is_company_member(company_id));
drop policy if exists carbon_mappings_update on public.carbon_mappings;
create policy carbon_mappings_update on public.carbon_mappings
  for update using (public.is_company_member(company_id));
drop policy if exists carbon_mappings_delete on public.carbon_mappings;
create policy carbon_mappings_delete on public.carbon_mappings
  for delete using (public.is_company_admin(company_id));

drop policy if exists pcf_calculations_select on public.pcf_calculations;
create policy pcf_calculations_select on public.pcf_calculations
  for select using (public.is_company_member(company_id));
drop policy if exists pcf_calculations_insert on public.pcf_calculations;
create policy pcf_calculations_insert on public.pcf_calculations
  for insert with check (public.is_company_member(company_id));
drop policy if exists pcf_calculations_update on public.pcf_calculations;
create policy pcf_calculations_update on public.pcf_calculations
  for update using (public.is_company_member(company_id));
drop policy if exists pcf_calculations_delete on public.pcf_calculations;
create policy pcf_calculations_delete on public.pcf_calculations
  for delete using (public.is_company_admin(company_id));

drop policy if exists carbon_ledger_select on public.carbon_ledger_entries;
create policy carbon_ledger_select on public.carbon_ledger_entries
  for select using (public.is_company_member(company_id));
drop policy if exists carbon_ledger_insert on public.carbon_ledger_entries;
create policy carbon_ledger_insert on public.carbon_ledger_entries
  for insert with check (public.is_company_member(company_id));
drop policy if exists carbon_ledger_update on public.carbon_ledger_entries;
create policy carbon_ledger_update on public.carbon_ledger_entries
  for update using (public.is_company_member(company_id));
drop policy if exists carbon_ledger_delete on public.carbon_ledger_entries;
create policy carbon_ledger_delete on public.carbon_ledger_entries
  for delete using (public.is_company_admin(company_id));
