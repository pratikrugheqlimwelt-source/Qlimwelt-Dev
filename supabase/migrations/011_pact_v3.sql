-- PACT V3 Phase 3a: additive exchange / identity / supplier PCF record tables
-- Adapter boundary only — does not alter BOM tree or calculateBomPcf logic.

-- Optional export metadata on existing calculations
alter table public.pcf_calculations
  add column if not exists pact_footprint_id uuid;

alter table public.pcf_calculations
  add column if not exists reference_period_start date;

alter table public.pcf_calculations
  add column if not exists reference_period_end date;

create index if not exists idx_pcf_calculations_pact_footprint
  on public.pcf_calculations(company_id, pact_footprint_id)
  where pact_footprint_id is not null;

-- ---------------------------------------------------------------------------
-- Peer endpoint configuration (secrets by reference only)
-- ---------------------------------------------------------------------------
create table if not exists public.pact_endpoints (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  base_url text not null,
  protocol_version text not null default '3.0.3',
  auth_type text not null default 'oauth2_client_credentials'
    check (auth_type in ('oauth2_client_credentials')),
  client_id text,
  client_secret_ref text,
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create index if not exists idx_pact_endpoints_company
  on public.pact_endpoints(company_id);

-- ---------------------------------------------------------------------------
-- Product / BOM-item identity URNs (PACT productIds / companyIds mapping)
-- ---------------------------------------------------------------------------
create table if not exists public.product_identity_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  bom_item_id uuid references public.bom_items(id) on delete cascade,
  scheme text not null default 'custom'
    check (scheme in ('custom', 'gtin', 'supplier_part', 'urn', 'company')),
  value text not null,
  urn text not null,
  status text not null default 'candidate'
    check (status in ('candidate', 'confirmed', 'rejected')),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source text not null default 'manual'
    check (source in ('manual', 'import', 'connector')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_id is not null or bom_item_id is not null or scheme = 'company'),
  unique (company_id, urn)
);

create index if not exists idx_product_identity_company
  on public.product_identity_mappings(company_id);
create index if not exists idx_product_identity_product
  on public.product_identity_mappings(product_id)
  where product_id is not null;
create index if not exists idx_product_identity_bom_item
  on public.product_identity_mappings(bom_item_id)
  where bom_item_id is not null;
create index if not exists idx_product_identity_status
  on public.product_identity_mappings(company_id, status);

-- ---------------------------------------------------------------------------
-- Durable inbound/outbound supplier PCF records (distinct from request workflow)
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_pcf_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id text references public.suppliers(id) on delete set null,
  product_identity_urns jsonb not null default '[]'::jsonb,
  declared_unit text,
  declared_unit_amount numeric,
  pcf_excluding_biogenic numeric,
  pcf_including_biogenic numeric,
  reference_period_start date,
  reference_period_end date,
  validity_period_start date,
  validity_period_end date,
  geography text,
  cross_sectoral_standards jsonb not null default '[]'::jsonb,
  secondary_emission_factor_sources jsonb not null default '[]'::jsonb,
  verification_json jsonb,
  dqi_json jsonb,
  pact_spec_version text not null default '3.0.0',
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received', 'mapped', 'accepted', 'rejected', 'expired')),
  mapped_bom_item_id uuid references public.bom_items(id) on delete set null,
  resulting_factor_id uuid references public.emission_factors(id) on delete set null,
  resulting_mapping_id uuid references public.carbon_mappings(id) on delete set null,
  pact_exchange_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_supplier_pcf_records_company
  on public.supplier_pcf_records(company_id);
create index if not exists idx_supplier_pcf_records_status
  on public.supplier_pcf_records(company_id, status);
create index if not exists idx_supplier_pcf_records_bom_item
  on public.supplier_pcf_records(mapped_bom_item_id)
  where mapped_bom_item_id is not null;

-- ---------------------------------------------------------------------------
-- Exchange / idempotency log
-- ---------------------------------------------------------------------------
create table if not exists public.pact_exchanges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  kind text not null
    check (kind in (
      'list', 'get', 'export', 'import',
      'event_request_created', 'event_fulfilled', 'event_rejected', 'event_published'
    )),
  endpoint_id uuid references public.pact_endpoints(id) on delete set null,
  idempotency_key text not null,
  correlation_id text,
  request_id text,
  status text not null default 'pending'
    check (status in ('pending', 'validated', 'mapped', 'completed', 'failed')),
  http_status integer,
  error_code text,
  error_detail text,
  footprint_id text,
  calculation_id uuid references public.pcf_calculations(id) on delete set null,
  supplier_pcf_record_id uuid references public.supplier_pcf_records(id) on delete set null,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (company_id, idempotency_key)
);

create index if not exists idx_pact_exchanges_company
  on public.pact_exchanges(company_id, created_at desc);
create index if not exists idx_pact_exchanges_status
  on public.pact_exchanges(company_id, status);
create index if not exists idx_pact_exchanges_footprint
  on public.pact_exchanges(company_id, footprint_id)
  where footprint_id is not null;
create index if not exists idx_pact_exchanges_calculation
  on public.pact_exchanges(calculation_id)
  where calculation_id is not null;

-- Back-reference from supplier records (added after pact_exchanges exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'supplier_pcf_records_pact_exchange_id_fkey'
  ) then
    alter table public.supplier_pcf_records
      add constraint supplier_pcf_records_pact_exchange_id_fkey
      foreign key (pact_exchange_id) references public.pact_exchanges(id) on delete set null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    drop trigger if exists pact_endpoints_updated_at on public.pact_endpoints;
    create trigger pact_endpoints_updated_at
      before update on public.pact_endpoints
      for each row execute function public.set_updated_at();

    drop trigger if exists product_identity_mappings_updated_at on public.product_identity_mappings;
    create trigger product_identity_mappings_updated_at
      before update on public.product_identity_mappings
      for each row execute function public.set_updated_at();

    drop trigger if exists supplier_pcf_records_updated_at on public.supplier_pcf_records;
    create trigger supplier_pcf_records_updated_at
      before update on public.supplier_pcf_records
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.pact_endpoints enable row level security;
alter table public.product_identity_mappings enable row level security;
alter table public.supplier_pcf_records enable row level security;
alter table public.pact_exchanges enable row level security;

drop policy if exists pact_endpoints_select on public.pact_endpoints;
create policy pact_endpoints_select on public.pact_endpoints
  for select using (public.is_company_member(company_id));
drop policy if exists pact_endpoints_insert on public.pact_endpoints;
create policy pact_endpoints_insert on public.pact_endpoints
  for insert with check (public.is_company_member(company_id));
drop policy if exists pact_endpoints_update on public.pact_endpoints;
create policy pact_endpoints_update on public.pact_endpoints
  for update using (public.is_company_member(company_id));
drop policy if exists pact_endpoints_delete on public.pact_endpoints;
create policy pact_endpoints_delete on public.pact_endpoints
  for delete using (public.is_company_admin(company_id));

drop policy if exists product_identity_select on public.product_identity_mappings;
create policy product_identity_select on public.product_identity_mappings
  for select using (public.is_company_member(company_id));
drop policy if exists product_identity_insert on public.product_identity_mappings;
create policy product_identity_insert on public.product_identity_mappings
  for insert with check (public.is_company_member(company_id));
drop policy if exists product_identity_update on public.product_identity_mappings;
create policy product_identity_update on public.product_identity_mappings
  for update using (public.is_company_member(company_id));
drop policy if exists product_identity_delete on public.product_identity_mappings;
create policy product_identity_delete on public.product_identity_mappings
  for delete using (public.is_company_admin(company_id));

drop policy if exists supplier_pcf_records_select on public.supplier_pcf_records;
create policy supplier_pcf_records_select on public.supplier_pcf_records
  for select using (public.is_company_member(company_id));
drop policy if exists supplier_pcf_records_insert on public.supplier_pcf_records;
create policy supplier_pcf_records_insert on public.supplier_pcf_records
  for insert with check (public.is_company_member(company_id));
drop policy if exists supplier_pcf_records_update on public.supplier_pcf_records;
create policy supplier_pcf_records_update on public.supplier_pcf_records
  for update using (public.is_company_member(company_id));
drop policy if exists supplier_pcf_records_delete on public.supplier_pcf_records;
create policy supplier_pcf_records_delete on public.supplier_pcf_records
  for delete using (public.is_company_admin(company_id));

drop policy if exists pact_exchanges_select on public.pact_exchanges;
create policy pact_exchanges_select on public.pact_exchanges
  for select using (public.is_company_member(company_id));
drop policy if exists pact_exchanges_insert on public.pact_exchanges;
create policy pact_exchanges_insert on public.pact_exchanges
  for insert with check (public.is_company_member(company_id));
drop policy if exists pact_exchanges_update on public.pact_exchanges;
create policy pact_exchanges_update on public.pact_exchanges
  for update using (public.is_company_member(company_id));
drop policy if exists pact_exchanges_delete on public.pact_exchanges;
create policy pact_exchanges_delete on public.pact_exchanges
  for delete using (public.is_company_admin(company_id));
