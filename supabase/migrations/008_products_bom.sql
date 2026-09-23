-- Products & versioned BOM foundation (Phase 1A)
-- Product / BOM structure only — no carbon mapping or calculation tables yet.

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  material_code text not null,
  name text not null,
  category text not null default 'general',
  subcategory text,
  material_type text not null default 'raw'
    check (material_type in ('raw', 'alloy', 'polymer', 'electronic', 'chemical', 'packaging', 'other')),
  density numeric,
  default_unit text not null default 'kg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, material_code)
);

create index if not exists idx_materials_company on public.materials(company_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_number text not null,
  name text not null,
  description text,
  category text not null default 'general',
  declared_unit text not null default 'piece',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, product_number)
);

create index if not exists idx_products_company on public.products(company_id);
create index if not exists idx_products_status on public.products(company_id, status);

create table if not exists public.product_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  version_label text not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'superseded', 'archived')),
  effective_from date,
  effective_to date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, version_label)
);

create index if not exists idx_product_versions_product on public.product_versions(product_id);
create index if not exists idx_product_versions_company on public.product_versions(company_id);

create table if not exists public.boms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_version_id uuid not null references public.product_versions(id) on delete cascade,
  bom_type text not null default 'engineering'
    check (bom_type in ('engineering', 'manufacturing', 'packaging', 'service')),
  version_label text not null default '1',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'superseded', 'archived')),
  effective_from date,
  effective_to date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_version_id, bom_type, version_label)
);

create index if not exists idx_boms_company on public.boms(company_id);
create index if not exists idx_boms_product_version on public.boms(product_version_id);

create table if not exists public.bom_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bom_id uuid not null references public.boms(id) on delete cascade,
  parent_item_id uuid references public.bom_items(id) on delete cascade,
  part_number text not null,
  description text not null default '',
  item_type text not null default 'component'
    check (item_type in ('product', 'assembly', 'component', 'material', 'process', 'packaging', 'other')),
  quantity numeric not null default 1 check (quantity >= 0),
  unit text not null default 'piece',
  scrap_rate numeric not null default 0 check (scrap_rate >= 0 and scrap_rate < 1),
  yield_rate numeric not null default 1 check (yield_rate > 0 and yield_rate <= 1),
  sequence_no integer not null default 0,
  supplier_id text references public.suppliers(id) on delete set null,
  material_id uuid references public.materials(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bom_items_bom on public.bom_items(bom_id);
create index if not exists idx_bom_items_parent on public.bom_items(parent_item_id);
create index if not exists idx_bom_items_company on public.bom_items(company_id);
create index if not exists idx_bom_items_part on public.bom_items(company_id, part_number);

create table if not exists public.bom_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bom_id uuid references public.boms(id) on delete set null,
  file_name text not null,
  status text not null default 'preview'
    check (status in ('preview', 'committed', 'failed', 'cancelled')),
  row_count integer not null default 0,
  valid_count integer not null default 0,
  warning_count integer not null default 0,
  error_count integer not null default 0,
  column_mapping jsonb not null default '{}'::jsonb,
  preview jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create index if not exists idx_bom_import_jobs_company on public.bom_import_jobs(company_id);
create index if not exists idx_bom_import_jobs_bom on public.bom_import_jobs(bom_id);

-- Soft bridge: product assessments may reference a product + BOM version
alter table public.assessments
  add column if not exists product_id uuid references public.products(id) on delete set null;

alter table public.assessments
  add column if not exists bom_id uuid references public.boms(id) on delete set null;

create index if not exists idx_assessments_product on public.assessments(product_id);
create index if not exists idx_assessments_bom on public.assessments(bom_id);

-- updated_at triggers (reuse set_updated_at if present)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    drop trigger if exists materials_updated_at on public.materials;
    create trigger materials_updated_at
      before update on public.materials
      for each row execute function public.set_updated_at();

    drop trigger if exists products_updated_at on public.products;
    create trigger products_updated_at
      before update on public.products
      for each row execute function public.set_updated_at();

    drop trigger if exists product_versions_updated_at on public.product_versions;
    create trigger product_versions_updated_at
      before update on public.product_versions
      for each row execute function public.set_updated_at();

    drop trigger if exists boms_updated_at on public.boms;
    create trigger boms_updated_at
      before update on public.boms
      for each row execute function public.set_updated_at();

    drop trigger if exists bom_items_updated_at on public.bom_items;
    create trigger bom_items_updated_at
      before update on public.bom_items
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.materials enable row level security;
alter table public.products enable row level security;
alter table public.product_versions enable row level security;
alter table public.boms enable row level security;
alter table public.bom_items enable row level security;
alter table public.bom_import_jobs enable row level security;

-- materials
drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials
  for select using (public.is_company_member(company_id));
drop policy if exists materials_insert on public.materials;
create policy materials_insert on public.materials
  for insert with check (public.is_company_member(company_id));
drop policy if exists materials_update on public.materials;
create policy materials_update on public.materials
  for update using (public.is_company_member(company_id));
drop policy if exists materials_delete on public.materials;
create policy materials_delete on public.materials
  for delete using (public.is_company_admin(company_id));

-- products
drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select using (public.is_company_member(company_id));
drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert with check (public.is_company_member(company_id));
drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update using (public.is_company_member(company_id));
drop policy if exists products_delete on public.products;
create policy products_delete on public.products
  for delete using (public.is_company_admin(company_id));

-- product_versions
drop policy if exists product_versions_select on public.product_versions;
create policy product_versions_select on public.product_versions
  for select using (public.is_company_member(company_id));
drop policy if exists product_versions_insert on public.product_versions;
create policy product_versions_insert on public.product_versions
  for insert with check (public.is_company_member(company_id));
drop policy if exists product_versions_update on public.product_versions;
create policy product_versions_update on public.product_versions
  for update using (public.is_company_member(company_id));
drop policy if exists product_versions_delete on public.product_versions;
create policy product_versions_delete on public.product_versions
  for delete using (public.is_company_admin(company_id));

-- boms
drop policy if exists boms_select on public.boms;
create policy boms_select on public.boms
  for select using (public.is_company_member(company_id));
drop policy if exists boms_insert on public.boms;
create policy boms_insert on public.boms
  for insert with check (public.is_company_member(company_id));
drop policy if exists boms_update on public.boms;
create policy boms_update on public.boms
  for update using (public.is_company_member(company_id));
drop policy if exists boms_delete on public.boms;
create policy boms_delete on public.boms
  for delete using (public.is_company_admin(company_id));

-- bom_items
drop policy if exists bom_items_select on public.bom_items;
create policy bom_items_select on public.bom_items
  for select using (public.is_company_member(company_id));
drop policy if exists bom_items_insert on public.bom_items;
create policy bom_items_insert on public.bom_items
  for insert with check (public.is_company_member(company_id));
drop policy if exists bom_items_update on public.bom_items;
create policy bom_items_update on public.bom_items
  for update using (public.is_company_member(company_id));
drop policy if exists bom_items_delete on public.bom_items;
create policy bom_items_delete on public.bom_items
  for delete using (public.is_company_admin(company_id));

-- bom_import_jobs
drop policy if exists bom_import_jobs_select on public.bom_import_jobs;
create policy bom_import_jobs_select on public.bom_import_jobs
  for select using (public.is_company_member(company_id));
drop policy if exists bom_import_jobs_insert on public.bom_import_jobs;
create policy bom_import_jobs_insert on public.bom_import_jobs
  for insert with check (public.is_company_member(company_id));
drop policy if exists bom_import_jobs_update on public.bom_import_jobs;
create policy bom_import_jobs_update on public.bom_import_jobs
  for update using (public.is_company_member(company_id));
drop policy if exists bom_import_jobs_delete on public.bom_import_jobs;
create policy bom_import_jobs_delete on public.bom_import_jobs
  for delete using (public.is_company_admin(company_id));
