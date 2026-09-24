-- Phase 1C: calculation approval, DQ dimensions, stale flags, append-only audit trail

-- Extend PCF calculations with approval + DQ + stale metadata
alter table public.pcf_calculations
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected'));

alter table public.pcf_calculations
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

alter table public.pcf_calculations
  add column if not exists approved_at timestamptz;

alter table public.pcf_calculations
  add column if not exists approval_notes text;

alter table public.pcf_calculations
  add column if not exists is_stale boolean not null default false;

alter table public.pcf_calculations
  add column if not exists stale_reason text;

alter table public.pcf_calculations
  add column if not exists stale_at timestamptz;

alter table public.pcf_calculations
  add column if not exists dq_temporal numeric check (dq_temporal is null or (dq_temporal >= 0 and dq_temporal <= 1));

alter table public.pcf_calculations
  add column if not exists dq_geo numeric check (dq_geo is null or (dq_geo >= 0 and dq_geo <= 1));

alter table public.pcf_calculations
  add column if not exists dq_tech numeric check (dq_tech is null or (dq_tech >= 0 and dq_tech <= 1));

alter table public.pcf_calculations
  add column if not exists dq_overall numeric check (dq_overall is null or (dq_overall >= 0 and dq_overall <= 1));

alter table public.pcf_calculations
  add column if not exists bom_fingerprint text;

alter table public.pcf_calculations
  add column if not exists mapping_fingerprint text;

create index if not exists idx_pcf_calculations_approval
  on public.pcf_calculations(company_id, approval_status);
create index if not exists idx_pcf_calculations_stale
  on public.pcf_calculations(company_id, is_stale);

-- Append-only audit trail (no update/delete policies for members)
create table if not exists public.bom_audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity_type text not null
    check (entity_type in (
      'product', 'bom', 'bom_item', 'mapping', 'calculation', 'emission_factor', 'dataset'
    )),
  entity_id text not null,
  action text not null
    check (action in (
      'created', 'updated', 'deleted', 'imported', 'mapped', 'mapping_approved', 'mapping_rejected',
      'calculated', 'calc_approved', 'calc_rejected', 'marked_stale', 'superseded'
    )),
  actor_id uuid references auth.users(id) on delete set null,
  actor_label text,
  summary text not null default '',
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_bom_audit_company on public.bom_audit_events(company_id, created_at desc);
create index if not exists idx_bom_audit_entity on public.bom_audit_events(company_id, entity_type, entity_id);
create index if not exists idx_bom_audit_action on public.bom_audit_events(company_id, action);

alter table public.bom_audit_events enable row level security;

drop policy if exists bom_audit_select on public.bom_audit_events;
create policy bom_audit_select on public.bom_audit_events
  for select using (public.is_company_member(company_id));

drop policy if exists bom_audit_insert on public.bom_audit_events;
create policy bom_audit_insert on public.bom_audit_events
  for insert with check (public.is_company_member(company_id));

-- No update/delete policies: append-only for normal members
